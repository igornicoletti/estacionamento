-- Align the clients/units read models with the permission catalog and remove
-- implicit browser privileges left by the historical schema bootstrap.

insert into public.app_permissions (key, label, description)
values (
  'units.yard.manage',
  'Gerenciar configuração de pátio',
  'Permite criar e atualizar a configuração de pátio das unidades.'
)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  updated_at = now();

insert into public.app_role_permissions (role_key, permission_key)
values ('admin', 'units.yard.manage')
on conflict (role_key, permission_key) do nothing;

alter table public.erp_clients enable row level security;
alter table public.erp_client_vehicles enable row level security;
alter table public.erp_units enable row level security;
alter table public.unit_yard_configs enable row level security;

revoke all on table public.erp_clients
from public, anon, authenticated;
revoke all on table public.erp_client_vehicles
from public, anon, authenticated;
revoke all on table public.erp_units
from public, anon, authenticated;
revoke all on table public.unit_yard_configs
from public, anon, authenticated;

grant select on table public.erp_clients to authenticated;
grant select on table public.erp_client_vehicles to authenticated;
grant select on table public.erp_units to authenticated;
grant select, insert, update on table public.unit_yard_configs
to authenticated;

-- Edge sync functions authenticate as service_role and still require table
-- privileges even though that role bypasses RLS.
grant select, insert, update on table public.erp_clients
to service_role;
grant select, insert, update on table public.erp_client_vehicles
to service_role;
grant select, insert, update on table public.erp_units
to service_role;
grant select, insert, update on table public.client_sync_runs
to service_role;
grant select, insert, update on table public.client_sync_state
to service_role;
grant select, insert, update on table public.unit_sync_runs
to service_role;
grant select, insert, update on table public.unit_sync_state
to service_role;

drop policy if exists "active users can read active clients"
on public.erp_clients;
drop policy if exists "permitted users can read active clients"
on public.erp_clients;
create policy "permitted users can read active clients"
on public.erp_clients
for select
to authenticated
using (
  (select private.has_current_user_permission('clients.read'))
  and is_active_120d
);

drop policy if exists "active users can read active client vehicles"
on public.erp_client_vehicles;
drop policy if exists "permitted users can read active client vehicles"
on public.erp_client_vehicles;
create policy "permitted users can read active client vehicles"
on public.erp_client_vehicles
for select
to authenticated
using (
  (select private.has_current_user_permission('client_vehicles.read'))
  and client_is_active_120d
);

drop policy if exists "active users can read erp units"
on public.erp_units;
drop policy if exists "permitted users can read erp units"
on public.erp_units;
create policy "permitted users can read erp units"
on public.erp_units
for select
to authenticated
using ((select private.has_current_user_permission('units.read')));

drop policy if exists "active users can read unit yard config"
on public.unit_yard_configs;
drop policy if exists "permitted users can read unit yard config"
on public.unit_yard_configs;
drop policy if exists "admins can manage unit yard config"
on public.unit_yard_configs;
drop policy if exists "active admins can insert unit yard config"
on public.unit_yard_configs;
drop policy if exists "active admins can update unit yard config"
on public.unit_yard_configs;
drop policy if exists "active admins can delete unit yard config"
on public.unit_yard_configs;
drop policy if exists "permitted users can insert unit yard config"
on public.unit_yard_configs;
drop policy if exists "permitted users can update unit yard config"
on public.unit_yard_configs;

create policy "permitted users can read unit yard config"
on public.unit_yard_configs
for select
to authenticated
using ((select private.has_current_user_permission('units.read')));

create policy "permitted users can insert unit yard config"
on public.unit_yard_configs
for insert
to authenticated
with check (
  (select private.has_current_user_permission('units.yard.manage'))
);

create policy "permitted users can update unit yard config"
on public.unit_yard_configs
for update
to authenticated
using (
  (select private.has_current_user_permission('units.yard.manage'))
)
with check (
  (select private.has_current_user_permission('units.yard.manage'))
);

create or replace function private.list_unit_user_stats()
returns table (
  unit_id text,
  managers bigint,
  operators bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or not private.has_current_user_permission('users.read') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  return query
  select
    unit_link.unit_id,
    count(*) filter (where app_user.role = 'manager') as managers,
    count(*) filter (where app_user.role = 'operator') as operators
  from public.app_user_units unit_link
  join public.app_users app_user
    on app_user.id = unit_link.app_user_id
  join public.erp_units unit_record
    on unit_record.cod_empresa::text = unit_link.unit_id
  where app_user.status = 'active'
  group by unit_link.unit_id
  order by unit_link.unit_id;
end;
$$;

revoke all on function private.list_unit_user_stats()
from public, anon, authenticated, service_role;
grant execute on function private.list_unit_user_stats()
to authenticated;

create or replace function public.list_unit_user_stats()
returns table (
  unit_id text,
  managers bigint,
  operators bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_unit_user_stats();
$$;

revoke all on function public.list_unit_user_stats()
from public, anon, authenticated, service_role;
grant execute on function public.list_unit_user_stats()
to authenticated;

create or replace function private.set_unit_yard_config_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

revoke all on function private.set_unit_yard_config_audit_fields()
from public, anon, authenticated, service_role;

drop trigger if exists trg_unit_yard_configs_updated_at
on public.unit_yard_configs;
drop trigger if exists trg_unit_yard_config_audit_fields
on public.unit_yard_configs;
create trigger trg_unit_yard_config_audit_fields
before insert or update on public.unit_yard_configs
for each row
execute function private.set_unit_yard_config_audit_fields();

create or replace function private.audit_unit_yard_config_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_name text;
begin
  select app_user.name
  into actor_name
  from public.app_users app_user
  where app_user.auth_user_id = actor_id;

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
    case
      when tg_op = 'INSERT' then 'unit.yard_created'
      else 'unit.yard_updated'
    end,
    coalesce(actor_name, case when actor_id is null then 'sistema' else 'usuario' end),
    actor_id,
    'unit_yard_config:' || new.unit_id::text,
    true,
    'info',
    jsonb_build_object(
      'operation', lower(tg_op),
      'unitId', new.unit_id,
      'before', case
        when tg_op = 'UPDATE' then jsonb_build_object(
          'patioActive', old.patio_active,
          'parkingSpots', old.parking_spots
        )
        else null
      end,
      'after', jsonb_build_object(
        'patioActive', new.patio_active,
        'parkingSpots', new.parking_spots
      )
    )
  );

  return new;
end;
$$;

revoke all on function private.audit_unit_yard_config_change()
from public, anon, authenticated, service_role;

drop trigger if exists trg_unit_yard_audit_change
on public.unit_yard_configs;
create trigger trg_unit_yard_audit_change
after insert or update on public.unit_yard_configs
for each row
execute function private.audit_unit_yard_config_change();
