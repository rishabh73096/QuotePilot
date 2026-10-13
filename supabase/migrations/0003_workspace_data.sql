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
