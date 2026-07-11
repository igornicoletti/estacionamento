create or replace function public.acquire_sync_lock(
  p_resource text,
  p_ttl_seconds integer default 300,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz;
  v_expires_at timestamptz;
  v_inserted integer;
  v_updated integer;
begin
  if p_resource is null or btrim(p_resource) = '' then
    raise exception 'p_resource is required';
  end if;

  if p_ttl_seconds is null or p_ttl_seconds < 10 then
    p_ttl_seconds := 10;
  end if;

  v_now := now();
  v_expires_at := v_now + make_interval(secs => p_ttl_seconds);

  insert into public.sync_locks (resource, acquired_at, expires_at, metadata)
  values (p_resource, v_now, v_expires_at, coalesce(p_metadata, '{}'::jsonb))
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    return true;
  end if;

  update public.sync_locks
  set acquired_at = v_now,
      expires_at = v_expires_at,
      metadata = coalesce(p_metadata, '{}'::jsonb)
  where resource = p_resource
    and expires_at <= v_now;

  get diagnostics v_updated = row_count;

  return v_updated > 0;
end;
$$;

create or replace function public.release_sync_lock(
  p_resource text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_resource is null or btrim(p_resource) = '' then
    raise exception 'p_resource is required';
  end if;

  delete from public.sync_locks
  where resource = p_resource;
end;
$$;

revoke execute on function public.acquire_sync_lock(text, integer, jsonb)
from public, anon, authenticated;
revoke execute on function public.release_sync_lock(text)
from public, anon, authenticated;
grant execute on function public.acquire_sync_lock(text, integer, jsonb) to service_role;
grant execute on function public.release_sync_lock(text) to service_role;

create or replace function private.audit_unit_yard_config_change()
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

revoke all on function private.audit_unit_yard_config_change()
from public, anon, authenticated;
grant execute on function private.audit_unit_yard_config_change() to service_role;

drop trigger if exists trg_unit_yard_audit_change on public.unit_yard_configs;
create trigger trg_unit_yard_audit_change
after insert or update on public.unit_yard_configs
for each row
execute function private.audit_unit_yard_config_change();

drop function if exists public.audit_unit_yard_config_change();

create or replace function private.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null
      and cmd.schema_name in ('public')
      and cmd.schema_name not in ('pg_catalog', 'information_schema')
      and cmd.schema_name not like 'pg_toast%'
      and cmd.schema_name not like 'pg_temp%'
    then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (schema: %)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$$;

revoke all on function private.rls_auto_enable()
from public, anon, authenticated, service_role;

drop event trigger if exists ensure_rls;
create event trigger ensure_rls
on ddl_command_end
when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
execute function private.rls_auto_enable();

drop function if exists public.rls_auto_enable();
