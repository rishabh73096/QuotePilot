-- QuotePilot: full Supabase setup in one file. Paste into Supabase > SQL Editor and run ONCE.
-- (0001 subscriptions/payments, 0002 admin/profiles, 0003 quotes data, 0004 test payments, 0005 roles, 0006 plan gating + public quote links)

-- ===== migrations/0001_subscriptions.sql =====
-- Subscriptions + manual UPI payments. Run in Supabase SQL editor.
-- Flow: user pays via UPI QR -> submits UTR (payments row, 'pending') ->
-- you verify it in your bank/UPI app -> set status = 'verified' -> trigger activates the plan for 30 days.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('Starter', 'Pro')),
  status text not null default 'active' check (status in ('active', 'expired')),
  current_period_end timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan text not null check (plan in ('Starter', 'Pro')),
  amount_inr integer not null,
  upi_ref text not null check (upi_ref ~ '^[A-Za-z0-9]{8,24}$'),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  -- keep prices in sync with config/landing.ts and lib/plans.ts
  constraint payments_amount_matches_plan check ((plan = 'Starter' and amount_inr = 499) or (plan = 'Pro' and amount_inr = 799)),
  constraint payments_upi_ref_unique unique (upi_ref)
);

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

create policy "read own subscription" on public.subscriptions for select using (auth.uid() = user_id);

create policy "read own payments" on public.payments for select using (auth.uid() = user_id);
create policy "submit own pending payment" on public.payments for insert
  with check (auth.uid() = user_id and status = 'pending');

-- Activate (or extend) the plan when a payment is marked verified.
create or replace function public.activate_subscription() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    insert into public.subscriptions (user_id, plan, status, current_period_end, updated_at)
    values (new.user_id, new.plan, 'active', now() + interval '30 days', now())
    on conflict (user_id) do update set
      plan = excluded.plan,
      status = 'active',
      current_period_end = greatest(public.subscriptions.current_period_end, now()) + interval '30 days',
      updated_at = now();
  end if;
  return new;
end $$;

create trigger payments_activate after update of status on public.payments
  for each row execute function public.activate_subscription();

-- To verify a payment (SQL editor / service role only; clients cannot update):
--   update public.payments set status = 'verified' where upi_ref = '<UTR>';

-- ===== migrations/0002_admin.sql =====
-- Platform admin (you, the SaaS owner): verify UPI payments, see customers and subscriptions.
-- Run after 0001_subscriptions.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;

-- Copy basic details from auth.users so admins can see who a payment belongs to.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill existing users
insert into public.profiles (id, email, name, phone)
select id, email, raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'phone' from auth.users
on conflict (id) do nothing;

create or replace function public.is_platform_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "admin reads profiles" on public.profiles for select using (public.is_platform_admin());
create policy "read own admin row" on public.platform_admins for select using (auth.uid() = user_id);

create policy "admin reads payments" on public.payments for select using (public.is_platform_admin());
create policy "admin updates payments" on public.payments for update
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "admin reads subscriptions" on public.subscriptions for select using (public.is_platform_admin());
create policy "admin updates subscriptions" on public.subscriptions for update
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Make yourself an admin (SQL editor, once):
--   insert into public.platform_admins (user_id) select id from auth.users where email = 'you@example.com';

-- ===== migrations/0003_workspace_data.sql =====
-- QuotePilot workspace data: customers, services, add-ons, settings, quotes, quote history.
-- Every row belongs to one user (the workspace owner). Run after 0001 and 0002.
-- Rule: totals are computed by the app's pricing engine from the owner's rules, and the database
-- re-checks that quotes.total equals the sum of its line items. AI never sets a price.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null default '',
  email text not null default '',
  address text not null default '' check (char_length(address) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists customers_user_idx on public.customers (user_id, created_at desc);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  base_price integer not null default 0 check (base_price >= 0),
  per_room integer not null default 0 check (per_room >= 0),
  per_bathroom integer not null default 0 check (per_bathroom >= 0),
  per_sqft numeric(8,2) not null default 0 check (per_sqft >= 0),
  min_price integer not null default 0 check (min_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists services_user_idx on public.services (user_id);

create table if not exists public.addons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  price integer not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists addons_user_idx on public.addons (user_id);

-- Pricing rules (travel charge, discount, tax, expiry), language and branding live in one JSON row.
create table if not exists public.workspace_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  number integer not null check (number > 0),          -- shown to customers as Quote #number; assigned by the app
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text not null default '',
  customer_email text not null default '',
  customer_address text not null default '' check (char_length(customer_address) <= 300),
  service_id uuid references public.services (id) on delete set null,
  service_name text not null default '',
  inputs jsonb not null default '{}'::jsonb,          -- rooms, bathrooms, area, addonIds
  line_items jsonb not null default '[]'::jsonb,      -- [{ label, detail, amount }]
  total integer not null default 0 check (total >= 0),
  proposal text not null default '' check (char_length(proposal) <= 4000),
  language text not null default 'en' check (language in ('en', 'hi')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'revision', 'expired')),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  expires_at timestamptz,
  revision_note text not null default '' check (char_length(revision_note) <= 1000),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists quotes_user_number_idx on public.quotes (user_id, number);
create index if not exists quotes_user_status_idx on public.quotes (user_id, status);
create index if not exists quotes_user_created_idx on public.quotes (user_id, created_at desc);

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quote_id uuid not null references public.quotes (id) on delete cascade,
  type text not null check (type in ('created', 'edit', 'sent', 'approved', 'revision', 'expired', 'note')),
  body text not null check (char_length(body) <= 2000),
  at timestamptz not null default now()
);
create index if not exists quote_events_quote_idx on public.quote_events (quote_id, at desc);

-- The stored total must equal the sum of the line items (guards against a tampered client).
create or replace function public.check_quote_total() returns trigger
language plpgsql set search_path = public as $$
declare line_sum numeric;
begin
  select coalesce(sum((item ->> 'amount')::numeric), 0) into line_sum from jsonb_array_elements(new.line_items) item;
  if new.total <> round(line_sum) then
    raise exception 'quote total does not match its line items';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists quotes_check_total on public.quotes;
create trigger quotes_check_total before insert or update on public.quotes
  for each row execute function public.check_quote_total();

alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.addons enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_events enable row level security;

create policy "own customers" on public.customers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own services" on public.services for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own addons" on public.addons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on public.workspace_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quotes" on public.quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quote events" on public.quote_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== migrations/0004_test_payments.sql =====
-- Testing mode for plans: lets a signed-in user activate a plan without paying,
-- but ONLY while the 'test_payments' flag below is true. Set it to false before launch.

create table if not exists public.app_flags (
  key text primary key,
  value boolean not null default false
);

alter table public.app_flags enable row level security;
drop policy if exists "anyone can read flags" on public.app_flags;
create policy "anyone can read flags" on public.app_flags for select using (true);

insert into public.app_flags (key, value) values ('test_payments', true)
on conflict (key) do nothing;

create or replace function public.activate_test_plan(p_plan text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_plan not in ('Starter', 'Pro') then raise exception 'unknown plan'; end if;
  if not coalesce((select value from public.app_flags where key = 'test_payments'), false) then
    raise exception 'test payments are switched off';
  end if;

  insert into public.subscriptions (user_id, plan, status, current_period_end, updated_at)
  values (auth.uid(), p_plan, 'active', now() + interval '30 days', now())
  on conflict (user_id) do update set
    plan = excluded.plan,
    status = 'active',
    current_period_end = now() + interval '30 days',
    updated_at = now();
end $$;

revoke execute on function public.activate_test_plan(text) from public, anon;
grant execute on function public.activate_test_plan(text) to authenticated;

-- BEFORE LAUNCH run:  update public.app_flags set value = false where key = 'test_payments';

-- ===== migrations/0005_roles_and_checks.sql =====
-- Roles must never come from anything a user can edit (like user_metadata).
-- This adds a server-side role and tightens the admin check.

-- 1) Workspace role lives in profiles. Users can read it but cannot change it
--    (no update policy and no UPDATE grant on profiles).
alter table public.profiles
  add column if not exists role text not null default 'owner' check (role in ('owner', 'admin', 'staff'));

-- 2) New profiles always start as 'owner'. The role sent from the signup form is ignored.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone', 'owner')
  on conflict (id) do nothing;
  return new;
end $$;

-- 3) Platform admin = listed in platform_admins AND has a confirmed email.
create or replace function public.is_platform_admin() returns boolean
language sql security definer stable set search_path = public, auth as $$
  select exists (
    select 1
    from public.platform_admins pa
    join auth.users u on u.id = pa.user_id
    where pa.user_id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

-- 4) Make sure signed-in users can never write to the role tables directly.
revoke insert, update, delete on public.profiles from authenticated, anon;
revoke insert, update, delete on public.platform_admins from authenticated, anon;

-- ===== migrations/0006_plan_features.sql =====
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

-- ===== grants.sql =====
-- Table privileges for the `authenticated` role (RLS policies still decide which rows). Safe to run more than once.
grant usage on schema public to anon, authenticated;

-- workspace data
grant select, insert, update, delete on public.customers, public.services, public.addons, public.workspace_settings, public.quotes, public.quote_events to authenticated;

-- billing: customers submit and read payments; admins update them (RLS limits who)
grant select, insert, update on public.payments to authenticated;
grant select, insert, update on public.subscriptions to authenticated;

-- roles and flags
grant select on public.profiles, public.platform_admins to authenticated;
grant update (role) on public.profiles to authenticated;
grant select on public.app_flags to anon, authenticated;
