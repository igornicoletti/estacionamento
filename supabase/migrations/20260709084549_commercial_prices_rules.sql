do $$ begin
  create type public.commercial_record_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.commercial_price_scope as enum ('network', 'unit');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.commercial_rule_type as enum ('vip', 'fuel_benefit');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.commercial_rule_target_type as enum ('client', 'vehicle', 'network', 'unit');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.commercial_price_tables (
  id text primary key default gen_random_uuid()::text,
  scope public.commercial_price_scope not null,
  unit_id text,
  unit_name text,
  grace_minutes integer not null default 0 check (grace_minutes >= 0 and grace_minutes <= 1440),
  tolerance_minutes integer not null default 0 check (tolerance_minutes >= 0 and tolerance_minutes <= 240),
  cycle_hours integer not null check (cycle_hours >= 1 and cycle_hours <= 720),
  amount numeric(12, 2) not null check (amount >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.commercial_record_status not null default 'active',
  version integer not null default 1 check (version > 0),
  parent_id text references public.commercial_price_tables(id) on delete set null,
  reason text check (reason is null or char_length(trim(reason)) between 10 and 500),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  check (ends_at is null or ends_at >= starts_at),
  check (
    (scope = 'network' and unit_id is null)
    or
    (scope = 'unit' and unit_id is not null)
  )
);

create table if not exists public.commercial_price_tiers (
  id text primary key default gen_random_uuid()::text,
  price_table_id text not null references public.commercial_price_tables(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  limit_hours integer not null check (limit_hours >= 1 and limit_hours <= 720),
  amount numeric(12, 2) not null check (amount >= 0),
  notes text check (notes is null or char_length(notes) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (price_table_id, sequence),
  unique (price_table_id, limit_hours)
);

create table if not exists public.commercial_rules (
  id text primary key default gen_random_uuid()::text,
  type public.commercial_rule_type not null,
  target_type public.commercial_rule_target_type not null,
  client_id integer,
  client_name text,
  vehicle_id integer,
  vehicle_plate text,
  applies_to_all_vehicles boolean not null default false,
  vehicle_ids integer[] not null default '{}'::integer[],
  applies_to_all_units boolean not null default true,
  unit_ids text[] not null default '{}'::text[],
  priority integer not null default 250 check (priority between 1 and 999),
  fuel_min_liters numeric(12, 3),
  benefit_hours numeric(8, 2),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status public.commercial_record_status not null default 'active',
  version integer not null default 1 check (version > 0),
  parent_id text references public.commercial_rules(id) on delete set null,
  reason text check (reason is null or char_length(trim(reason)) between 10 and 500),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  check (ends_at is null or ends_at >= starts_at),
  check (
    (type = 'vip' and client_id is not null and client_name is not null and fuel_min_liters is null and benefit_hours is null)
    or
    (type = 'fuel_benefit' and fuel_min_liters is not null and fuel_min_liters > 0 and benefit_hours is not null and benefit_hours > 0)
  ),
  check (
    (target_type = 'client' and client_id is not null)
    or
    (target_type = 'vehicle' and client_id is not null and vehicle_id is not null)
    or
    (target_type in ('network', 'unit'))
  )
);

create index if not exists commercial_price_tables_status_idx
on public.commercial_price_tables(status, starts_at, ends_at);

create index if not exists commercial_price_tables_scope_unit_idx
on public.commercial_price_tables(scope, unit_id);

create index if not exists commercial_price_tiers_price_table_idx
on public.commercial_price_tiers(price_table_id, sequence);

create index if not exists commercial_rules_type_status_idx
on public.commercial_rules(type, status, starts_at, ends_at);

create index if not exists commercial_rules_client_idx
on public.commercial_rules(client_id);

create index if not exists commercial_rules_vehicle_idx
on public.commercial_rules(vehicle_id);

drop trigger if exists trg_commercial_price_tables_updated_at on public.commercial_price_tables;
create trigger trg_commercial_price_tables_updated_at
before update on public.commercial_price_tables
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_commercial_price_tiers_updated_at on public.commercial_price_tiers;
create trigger trg_commercial_price_tiers_updated_at
before update on public.commercial_price_tiers
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_commercial_rules_updated_at on public.commercial_rules;
create trigger trg_commercial_rules_updated_at
before update on public.commercial_rules
for each row
execute function public.set_updated_at_timestamp();

alter table public.commercial_price_tables enable row level security;
alter table public.commercial_price_tiers enable row level security;
alter table public.commercial_rules enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.commercial_price_tables to authenticated;
grant select, insert, update, delete on public.commercial_price_tiers to authenticated;
grant select, insert, update, delete on public.commercial_rules to authenticated;

drop policy if exists "commercial readers can read price tables" on public.commercial_price_tables;
create policy "commercial readers can read price tables"
on public.commercial_price_tables
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin', 'auditor')
  )
);

drop policy if exists "commercial managers can mutate price tables" on public.commercial_price_tables;
create policy "commercial managers can mutate price tables"
on public.commercial_price_tables
for all
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin')
  )
);

drop policy if exists "commercial readers can read price tiers" on public.commercial_price_tiers;
create policy "commercial readers can read price tiers"
on public.commercial_price_tiers
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin', 'auditor')
  )
);

drop policy if exists "commercial managers can mutate price tiers" on public.commercial_price_tiers;
create policy "commercial managers can mutate price tiers"
on public.commercial_price_tiers
for all
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin')
  )
);

drop policy if exists "commercial readers can read rules" on public.commercial_rules;
create policy "commercial readers can read rules"
on public.commercial_rules
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin', 'auditor')
  )
);

drop policy if exists "commercial managers can mutate rules" on public.commercial_rules;
create policy "commercial managers can mutate rules"
on public.commercial_rules
for all
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin')
  )
);
