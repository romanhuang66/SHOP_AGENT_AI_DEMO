-- ShopAgent single-merchant demo persistence.
-- Run in your Supabase project's SQL Editor. Existing tables are not removed.
create table if not exists public.shopagent_state (
  id text primary key,
  data jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.shopagent_state enable row level security;
revoke all on table public.shopagent_state from anon, authenticated;
grant select, insert, update, delete on table public.shopagent_state to service_role;
-- No public/browser policies: access is through the application's server API only.
