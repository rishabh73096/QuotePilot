-- Plan features enforced in the database (the UI also hides them, but this is the real lock),
-- plus public quote links for customers and what the platform admin may change.

-- True when the signed-in user has an active, unexpired plan that includes the feature tier.
-- p_min = 'Starter' (any paid plan) or 'Pro'. Platform admins always pass.
create or replace function public.has_active_plan(p_min text) returns boolean
language sql security definer stable set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid()
      and s.status = 'active'
      and s.current_period_end > now()
      and (p_min = 'Starter' or s.plan = 'Pro')
  );
$$;

-- Everything in the workspace needs a paid plan (Starter or Pro).
do $$
declare t text;
begin
  foreach t in array array['customers', 'services', 'addons', 'workspace_settings', 'quotes', 'quote_events'] loop
    execute format('drop policy if exists %I on public.%I', 'own ' || replace(t, '_', ' '), t);
  end loop;
end $$;
drop policy if exists "own customers" on public.customers;
drop policy if exists "own services" on public.services;
drop policy if exists "own addons" on public.addons;
drop policy if exists "own settings" on public.workspace_settings;
drop policy if exists "own quotes" on public.quotes;
drop policy if exists "own quote events" on public.quote_events;

create policy "own customers" on public.customers for all
  using (auth.uid() = user_id and public.has_active_plan('Starter')) with check (auth.uid() = user_id and public.has_active_plan('Starter'));
create policy "own services" on public.services for all
  using (auth.uid() = user_id and public.has_active_plan('Starter')) with check (auth.uid() = user_id and public.has_active_plan('Starter'));
create policy "own addons" on public.addons for all
  using (auth.uid() = user_id and public.has_active_plan('Starter')) with check (auth.uid() = user_id and public.has_active_plan('Starter'));
create policy "own settings" on public.workspace_settings for all
  using (auth.uid() = user_id and public.has_active_plan('Starter')) with check (auth.uid() = user_id and public.has_active_plan('Starter'));
create policy "own quotes" on public.quotes for all
  using (auth.uid() = user_id and public.has_active_plan('Starter')) with check (auth.uid() = user_id and public.has_active_plan('Starter'));
create policy "own quote events" on public.quote_events for all
  using (auth.uid() = user_id and public.has_active_plan('Starter')) with check (auth.uid() = user_id and public.has_active_plan('Starter'));

-- Pro-only: share links / approval states, and AI proposal text. Starter quotes stay drafts with PDF export.
create or replace function public.enforce_quote_plan() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap integer; used integer; plan_name text;
begin
  if auth.uid() is null then return new; end if; -- service role / SQL editor
  if new.status <> 'draft' and not public.has_active_plan('Pro') then
    raise exception 'share links and approvals need the Pro plan';
  end if;
  if new.proposal <> '' and not public.has_active_plan('Pro') then
    raise exception 'AI proposals need the Pro plan';
  end if;

  if tg_op = 'INSERT' and not public.is_platform_admin() then
    select plan into plan_name from public.subscriptions where user_id = auth.uid();
    cap := case when plan_name = 'Pro' then 500 else 50 end;  -- keep in sync with lib/plans.ts PLAN_QUOTE_CAP
    select count(*) into used from public.quotes
      where user_id = auth.uid() and created_at >= date_trunc('month', now());
    if used >= cap then raise exception 'monthly quote limit reached'; end if;
  end if;
  return new;
end $$;

drop trigger if exists quotes_enforce_plan on public.quotes;
create trigger quotes_enforce_plan before insert or update on public.quotes
  for each row execute function public.enforce_quote_plan();

-- Customer-facing quote link (no login). Only the fields a customer needs, and only for Pro workspaces.
create or replace function public.get_public_quote(p_token text) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare q public.quotes; s jsonb;
begin
  select * into q from public.quotes where token = p_token and status <> 'draft';
  if not found then return null; end if;
  select data into s from public.workspace_settings where user_id = q.user_id;
  return jsonb_build_object(
    'number', q.number,
    'customerName', q.customer_name,
    'serviceName', q.service_name,
    'lineItems', q.line_items,
    'total', q.total,
    'proposal', q.proposal,
    'language', q.language,
    'status', case when q.status = 'sent' and q.expires_at < now() then 'expired' else q.status end,
    'expiresAt', q.expires_at,
    'business', jsonb_build_object(
      'name', coalesce(s ->> 'businessName', ''),
      'color', coalesce(s #>> '{brand,color}', '#e8590c'),
      'footer', coalesce(s #>> '{brand,footer}', '')
    )
  );
end $$;

-- The customer approves or asks for changes. Allowed once, while the quote is 'sent' and not expired.
create or replace function public.respond_public_quote(p_token text, p_action text, p_note text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  if p_action not in ('approve', 'revise') then raise exception 'unknown action'; end if;
  select * into q from public.quotes where token = p_token for update;
  if not found or q.status <> 'sent' then raise exception 'this quote can no longer be answered'; end if;
  if q.expires_at is not null and q.expires_at < now() then raise exception 'this quote has expired'; end if;

  update public.quotes set
    status = case when p_action = 'approve' then 'approved' else 'revision' end,
    revision_note = left(coalesce(p_note, ''), 1000),
    responded_at = now()
  where id = q.id;

  insert into public.quote_events (user_id, quote_id, type, body)
  values (q.user_id, q.id, case when p_action = 'approve' then 'approved' else 'revision' end,
          case when p_action = 'approve' then 'Customer approved the quote' else 'Customer asked for changes: ' || left(coalesce(p_note, ''), 300) end);

  return jsonb_build_object('status', case when p_action = 'approve' then 'approved' else 'revision' end);
end $$;

revoke execute on function public.get_public_quote(text) from public;
revoke execute on function public.respond_public_quote(text, text, text) from public;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.respond_public_quote(text, text, text) to anon, authenticated;

-- Mark unanswered quotes expired. Call from a Supabase cron job (pg_cron) or Edge Function, e.g. hourly:
--   select public.expire_quotes();
create or replace function public.expire_quotes() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with expired as (
    update public.quotes set status = 'expired'
    where status = 'sent' and expires_at < now()
    returning id, user_id
  ), logged as (
    insert into public.quote_events (user_id, quote_id, type, body)
    select user_id, id, 'expired', 'Quote expired without a reply' from expired
  )
  select count(*) into n from expired;
  return n;
end $$;
revoke execute on function public.expire_quotes() from public, anon, authenticated;

-- Platform admin can change a customer's plan (create one if they have none) and their workspace role.
drop policy if exists "admin inserts subscriptions" on public.subscriptions;
create policy "admin inserts subscriptions" on public.subscriptions
  for insert with check (public.is_platform_admin());
grant insert on public.subscriptions to authenticated;

drop policy if exists "admin updates profiles" on public.profiles;
create policy "admin updates profiles" on public.profiles
  for update using (public.is_platform_admin()) with check (public.is_platform_admin());
-- only the role column can ever be written, and only through the admin policy above
grant update (role) on public.profiles to authenticated;
