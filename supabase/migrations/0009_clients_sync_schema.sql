create table if not exists public.erp_clients (
  cod_pessoa bigint primary key,
  nom_pessoa text not null,
  nom_fantasia text not null,
  num_cnpj_cpf text not null,
  des_email_1 text not null,
  num_telefone_1 text not null,
  nom_cidade text not null,
  sgl_estado text not null,
  dta_cadastro date,
  ind_pessoa_ativa text not null,
  bloqueio_financeiro text not null,
  qtd_veiculos integer not null default 0,
  dta_ultima_compra date,
  is_active_120d boolean not null default false,
  source_hash text not null,
  source_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists erp_clients_name_idx
on public.erp_clients(nom_pessoa);

create index if not exists erp_clients_document_idx
on public.erp_clients(num_cnpj_cpf);

create index if not exists erp_clients_city_state_idx
on public.erp_clients(nom_cidade, sgl_estado);

create index if not exists erp_clients_active_120d_idx
on public.erp_clients(is_active_120d, dta_ultima_compra desc);

create table if not exists public.erp_client_vehicles (
  cod_veiculo bigint primary key,
  cod_pessoa bigint not null references public.erp_clients(cod_pessoa) on delete cascade,
  nom_pessoa text not null,
  nom_fantasia text not null,
  num_cnpj_cpf text not null,
  num_placa text not null,
  des_veiculo text not null,
  nom_motorista text not null,
  client_is_active_120d boolean not null default false,
  source_hash text not null,
  source_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists erp_client_vehicles_plate_idx
on public.erp_client_vehicles(num_placa);

create index if not exists erp_client_vehicles_client_idx
on public.erp_client_vehicles(cod_pessoa);

create index if not exists erp_client_vehicles_active_idx
on public.erp_client_vehicles(client_is_active_120d);

create table if not exists public.client_sync_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('full', 'incremental')),
  trigger text not null check (trigger in ('automatic', 'manual')),
  status text not null check (status in ('success', 'warning', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer,
  message text not null default '',
  counters_clients_received integer not null default 0,
  counters_clients_created integer not null default 0,
  counters_clients_updated integer not null default 0,
  counters_clients_unchanged integer not null default 0,
  counters_clients_failed integer not null default 0,
  counters_vehicles_received integer not null default 0,
  counters_vehicles_created integer not null default 0,
  counters_vehicles_updated integer not null default 0,
  counters_vehicles_unchanged integer not null default 0,
  counters_vehicles_failed integer not null default 0,
  consecutive_failures integer not null default 0,
  source text not null default 'hubapi',
  requested_by uuid references auth.users(id) on delete set null,
  error_details jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists client_sync_runs_started_idx
on public.client_sync_runs(started_at desc);

create table if not exists public.client_sync_state (
  singleton_key boolean primary key default true check (singleton_key),
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  last_successful_sync_at timestamptz,
  last_cursor text,
  consecutive_failures integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.client_sync_state (singleton_key)
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

drop trigger if exists trg_erp_clients_updated_at on public.erp_clients;
create trigger trg_erp_clients_updated_at
before update on public.erp_clients
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_erp_client_vehicles_updated_at on public.erp_client_vehicles;
create trigger trg_erp_client_vehicles_updated_at
before update on public.erp_client_vehicles
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_client_sync_state_updated_at on public.client_sync_state;
create trigger trg_client_sync_state_updated_at
before update on public.client_sync_state
for each row
execute function public.set_updated_at_timestamp();

alter table public.erp_clients enable row level security;
alter table public.erp_client_vehicles enable row level security;
alter table public.client_sync_runs enable row level security;
alter table public.client_sync_state enable row level security;

grant select on public.erp_clients to authenticated;
grant select on public.erp_client_vehicles to authenticated;
grant select on public.client_sync_runs to authenticated;
grant select on public.client_sync_state to authenticated;

drop policy if exists "active users can read active clients" on public.erp_clients;
create policy "active users can read active clients"
on public.erp_clients
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and is_active_120d
);

drop policy if exists "active users can read active client vehicles" on public.erp_client_vehicles;
create policy "active users can read active client vehicles"
on public.erp_client_vehicles
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and client_is_active_120d
);

drop policy if exists "active users can read client sync runs" on public.client_sync_runs;
create policy "active users can read client sync runs"
on public.client_sync_runs
for select
to authenticated
using (public.current_user_status() = 'active');

drop policy if exists "active users can read client sync state" on public.client_sync_state;
create policy "active users can read client sync state"
on public.client_sync_state
for select
to authenticated
using (public.current_user_status() = 'active');
