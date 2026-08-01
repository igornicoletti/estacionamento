-- Vehicle payloads fit in the network response but exceed the Edge compute
-- budget when normalized and persisted in one invocation. Persist a bounded
-- cursor and let pg_cron resume one deterministic plate partition at a time.
create or replace function private.enqueue_pending_clients_vehicle_partition()
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  cursor_payload jsonb;
  cursor_text text;
  request_id bigint;
begin
  select last_cursor
  into cursor_text
  from public.client_sync_state
  where singleton_key = true;

  if cursor_text is null then
    return null;
  end if;

  begin
    cursor_payload := cursor_text::jsonb;
  exception
    when others then
      return null;
  end;

  if cursor_payload->>'kind' is null
    or cursor_payload->>'mode' is null
    or cursor_payload->>'partitionCount' is null
    or cursor_payload->>'nextPartition' is null
    or cursor_payload->>'batchStartedAt' is null
    or cursor_payload->>'kind' <> 'vehicle_partitions'
    or cursor_payload->>'mode' not in ('incremental', 'full')
    or (cursor_payload->>'partitionCount')::integer < 1
    or (cursor_payload->>'nextPartition')::integer < 0
    or (cursor_payload->>'nextPartition')::integer >= (cursor_payload->>'partitionCount')::integer
    or (cursor_payload->>'batchStartedAt')::timestamptz < pg_catalog.now() - interval '2 hours' then
    return null;
  end if;

  if exists (
    select 1
    from public.sync_locks
    where resource = 'clients-sync'
      and expires_at > pg_catalog.now()
  ) then
    return null;
  end if;

  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'sync_project_url'
    ) || '/functions/v1/clients-sync',
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'clients_sync_secret'
      )
    ),
    body := pg_catalog.jsonb_build_object(
      'mode', cursor_payload->>'mode',
      'scope', 'vehicles',
      'partitionIndex', (cursor_payload->>'nextPartition')::integer,
      'trigger', 'automatic'
    ),
    timeout_milliseconds := 145000
  )
  into request_id;

  return request_id;
exception
  when invalid_text_representation or datetime_field_overflow then
    return null;
end;
$function$;

revoke all on function private.enqueue_pending_clients_vehicle_partition()
from public, anon, authenticated, service_role;

create or replace function private.configure_clients_sync_cron(
  p_project_url text,
  p_sync_secret text,
  p_incremental_cron text default '0 9,15,21 * * *',
  p_full_cron text default '0 3 * * *'
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  base_url text;
begin
  if nullif(pg_catalog.btrim(p_project_url), '') is null then
    raise exception 'p_project_url is required';
  end if;

  if nullif(pg_catalog.btrim(p_sync_secret), '') is null then
    raise exception 'p_sync_secret is required';
  end if;

  base_url := pg_catalog.regexp_replace(pg_catalog.btrim(p_project_url), '/+$', '');

  perform private.upsert_sync_cron_secret(
    'sync_project_url',
    base_url,
    'Base URL used by scheduled sync Edge Function calls.'
  );
  perform private.upsert_sync_cron_secret(
    'clients_sync_secret',
    p_sync_secret,
    'Service-to-service secret for scheduled clients synchronization.'
  );

  perform private.remove_clients_sync_cron();

  perform cron.schedule(
    'client-sync-incremental-clients',
    p_incremental_cron,
    $cron$select private.enqueue_clients_sync_phase('incremental', 'clients');$cron$
  );
  perform cron.schedule(
    'client-sync-full-clients',
    p_full_cron,
    $cron$select private.enqueue_clients_sync_phase('full', 'clients');$cron$
  );
  perform cron.schedule(
    'client-sync-vehicles-resume',
    '*/5 * * * *',
    $cron$select private.enqueue_pending_clients_vehicle_partition();$cron$
  );
end;
$function$;

revoke all on function private.configure_clients_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.configure_clients_sync_cron(text, text, text, text)
to service_role;

comment on function private.enqueue_pending_clients_vehicle_partition() is
  'Retoma a próxima partição de veículos registrada no cursor, sem expor segredo à API.';

comment on function private.configure_clients_sync_cron(text, text, text, text) is
  'Agenda clientes e um retomador idempotente das partições de veículos a cada cinco minutos.';
