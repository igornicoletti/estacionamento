do $$
declare
  clients_group_id uuid;
begin
  select id
    into clients_group_id
  from public.permission_groups
  where key = 'clients';

  if clients_group_id is null then
    insert into public.permission_groups (key, label, sort_order)
    values ('clients', 'Clientes', 50)
    returning id into clients_group_id;
  end if;

  insert into public.permissions (group_id, key, label, description, is_critical, sort_order)
  values (
    clients_group_id,
    'clients.sync.read',
    'Visualizar histórico de sincronização de clientes',
    'Permite visualizar execuções de sincronização de clientes e veículos.',
    true,
    55
  )
  on conflict (key) do update set
    group_id = excluded.group_id,
    label = excluded.label,
    description = excluded.description,
    is_critical = excluded.is_critical,
    is_active = true,
    sort_order = excluded.sort_order,
    source = 'system',
    updated_at = now();
end $$;

with role_permission_seed (role, permission_key) as (
  values
    ('owner'::public.app_user_role, 'clients.sync.read'),
    ('admin'::public.app_user_role, 'clients.sync.read'),
    ('auditor'::public.app_user_role, 'clients.sync.read')
)
insert into public.role_permissions (role, permission_id)
select role_permission_seed.role, permissions.id
from role_permission_seed
join public.permissions on permissions.key = role_permission_seed.permission_key
on conflict (role, permission_id) do nothing;

alter table public.erp_clients enable row level security;
alter table public.erp_client_vehicles enable row level security;
alter table public.client_sync_runs enable row level security;
alter table public.client_sync_state enable row level security;

alter table public.client_sync_runs
  add column if not exists counters_clients_rejected integer not null default 0;

alter table public.client_sync_runs
  add column if not exists counters_vehicles_rejected integer not null default 0;

drop policy if exists "active users can read active clients" on public.erp_clients;
drop policy if exists "permitted users can read active clients" on public.erp_clients;
create policy "permitted users can read active clients"
on public.erp_clients
for select
to authenticated
using (
  private.has_current_user_permission('clients.read')
  and is_active_120d
);

drop policy if exists "active users can read active client vehicles" on public.erp_client_vehicles;
drop policy if exists "permitted users can read active client vehicles" on public.erp_client_vehicles;
create policy "permitted users can read active client vehicles"
on public.erp_client_vehicles
for select
to authenticated
using (
  private.has_current_user_permission('client_vehicles.read')
  and client_is_active_120d
);

drop policy if exists "active users can read client sync runs" on public.client_sync_runs;
drop policy if exists "permitted users can read client sync runs" on public.client_sync_runs;
create policy "permitted users can read client sync runs"
on public.client_sync_runs
for select
to authenticated
using (
  private.has_current_user_permission('clients.sync.read')
  or private.has_current_user_permission('sync.execute')
  or private.has_current_user_permission('audit.read')
);

drop policy if exists "active users can read client sync state" on public.client_sync_state;
drop policy if exists "permitted users can read client sync state" on public.client_sync_state;
create policy "permitted users can read client sync state"
on public.client_sync_state
for select
to authenticated
using (
  private.has_current_user_permission('clients.sync.read')
  or private.has_current_user_permission('sync.execute')
  or private.has_current_user_permission('audit.read')
);

create index if not exists erp_client_vehicles_client_active_plate_idx
on public.erp_client_vehicles(cod_pessoa, client_is_active_120d, num_placa);

create index if not exists client_sync_runs_requested_by_idx
on public.client_sync_runs(requested_by);
