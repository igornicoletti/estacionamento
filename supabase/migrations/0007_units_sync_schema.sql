create table if not exists public.erp_units (
  cod_empresa bigint primary key,
  nom_razao_social text not null,
  nom_fantasia text not null,
  num_cnpj text not null,
  cod_bandeira bigint not null,
  des_bandeira text not null,
  cod_cidade bigint not null,
  nom_cidade text not null,
  nom_estado text not null,
  sgl_estado text not null,
  des_coordenada_empresa text not null,
  ip_rede text not null,
  nom_banco_dados text not null,
  source_hash text not null,
  source_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists erp_units_bandeira_idx
on public.erp_units(des_bandeira);

create index if not exists erp_units_estado_idx
on public.erp_units(sgl_estado);

create table if not exists public.unit_yard_configs (
  unit_id bigint primary key references public.erp_units(cod_empresa) on delete cascade,
  patio_active boolean not null default false,
  parking_spots integer not null default 0 check (parking_spots >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.unit_sync_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('full', 'incremental')),
  trigger text not null check (trigger in ('automatic', 'manual')),
  status text not null check (status in ('success', 'warning', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer,
  message text not null default '',
  counters_received integer not null default 0,
  counters_created integer not null default 0,
  counters_updated integer not null default 0,
  counters_unchanged integer not null default 0,
  counters_failed integer not null default 0,
  consecutive_failures integer not null default 0,
  source text not null default 'hubapi',
  requested_by uuid references auth.users(id) on delete set null,
  error_details jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists unit_sync_runs_started_idx
on public.unit_sync_runs(started_at desc);

create table if not exists public.unit_sync_state (
  singleton_key boolean primary key default true check (singleton_key),
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  last_successful_sync_at timestamptz,
  last_cursor text,
  consecutive_failures integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.unit_sync_state (singleton_key)
values (true)
on conflict (singleton_key) do nothing;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_erp_units_updated_at on public.erp_units;
create trigger trg_erp_units_updated_at
before update on public.erp_units
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_unit_yard_configs_updated_at on public.unit_yard_configs;
create trigger trg_unit_yard_configs_updated_at
before update on public.unit_yard_configs
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_unit_sync_state_updated_at on public.unit_sync_state;
create trigger trg_unit_sync_state_updated_at
before update on public.unit_sync_state
for each row
execute function public.set_updated_at_timestamp();

create or replace function public.audit_unit_yard_config_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
begin
  actor_id := auth.uid();

  insert into public.audit_events (
    scope,
    event,
    actor,
    actor_user_id,
    target,
    success,
    severity,
    metadata
  )
  values (
    'system',
    'unit.yard_updated',
    case when actor_id is null then 'sistema' else 'usuario' end,
    actor_id,
    'unit_yard_config',
    true,
    'info',
    jsonb_build_object(
      'unitId', new.unit_id,
      'patioActive', new.patio_active,
      'parkingSpots', new.parking_spots
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_unit_yard_audit_change on public.unit_yard_configs;
create trigger trg_unit_yard_audit_change
after insert or update on public.unit_yard_configs
for each row
execute function public.audit_unit_yard_config_change();

alter table public.erp_units enable row level security;
alter table public.unit_yard_configs enable row level security;
alter table public.unit_sync_runs enable row level security;
alter table public.unit_sync_state enable row level security;

grant select on public.erp_units to authenticated;
grant select on public.unit_yard_configs to authenticated;
grant insert, update on public.unit_yard_configs to authenticated;
grant select on public.unit_sync_runs to authenticated;
grant select on public.unit_sync_state to authenticated;

drop policy if exists "active users can read erp units" on public.erp_units;
create policy "active users can read erp units"
on public.erp_units
for select
to authenticated
using (public.current_user_status() = 'active');

drop policy if exists "active users can read unit yard config" on public.unit_yard_configs;
create policy "active users can read unit yard config"
on public.unit_yard_configs
for select
to authenticated
using (public.current_user_status() = 'active');

drop policy if exists "admins can manage unit yard config" on public.unit_yard_configs;
create policy "admins can manage unit yard config"
on public.unit_yard_configs
for all
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin')
)
with check (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin')
);

drop policy if exists "active users can read unit sync runs" on public.unit_sync_runs;
create policy "active users can read unit sync runs"
on public.unit_sync_runs
for select
to authenticated
using (public.current_user_status() = 'active');

drop policy if exists "active users can read unit sync state" on public.unit_sync_state;
create policy "active users can read unit sync state"
on public.unit_sync_state
for select
to authenticated
using (public.current_user_status() = 'active');
