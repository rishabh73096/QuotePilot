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
