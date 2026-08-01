-- A full ERP payload exceeds the Edge Runtime CPU budget when clients and
-- vehicles share one invocation. Enqueue each phase separately and advance the
-- shared checkpoint only after the vehicles phase succeeds.
create or replace function private.enqueue_clients_sync_phase(
  p_mode text,
  p_scope text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  request_id bigint;
begin
  if p_mode not in ('incremental', 'full') then
    raise exception 'unsupported clients sync mode';
  end if;

  if p_scope not in ('clients', 'vehicles') then
    raise exception 'unsupported clients sync scope';
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
      'mode', p_mode,
      'scope', p_scope,
      'trigger', 'automatic'
    )
  )
  into request_id;

  return request_id;
end;
$function$;

revoke all on function private.enqueue_clients_sync_phase(text, text)
from public, anon, authenticated, service_role;

create or replace function private.remove_clients_sync_cron()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  sync_job record;
begin
  for sync_job in
    select jobid
    from cron.job
    where jobname like 'client-sync-%'
  loop
    perform cron.unschedule(sync_job.jobid);
  end loop;
end;
$function$;

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
  incremental_minute integer;
  full_minute integer;
  vehicle_incremental_cron text;
  vehicle_full_cron text;
begin
  if nullif(pg_catalog.btrim(p_project_url), '') is null then
    raise exception 'p_project_url is required';
  end if;

  if nullif(pg_catalog.btrim(p_sync_secret), '') is null then
    raise exception 'p_sync_secret is required';
  end if;

  if pg_catalog.btrim(p_incremental_cron) !~ '^[0-9]+[[:space:]]+'
    or pg_catalog.btrim(p_full_cron) !~ '^[0-9]+[[:space:]]+' then
    raise exception 'clients sync cron expressions must start with a numeric minute';
  end if;

  incremental_minute := pg_catalog.split_part(pg_catalog.btrim(p_incremental_cron), ' ', 1)::integer;
  full_minute := pg_catalog.split_part(pg_catalog.btrim(p_full_cron), ' ', 1)::integer;

  if incremental_minute not between 0 and 49 or full_minute not between 0 and 49 then
    raise exception 'clients sync cron minute must be between 0 and 49';
  end if;

  base_url := pg_catalog.regexp_replace(pg_catalog.btrim(p_project_url), '/+$', '');
  vehicle_incremental_cron := pg_catalog.regexp_replace(
    pg_catalog.btrim(p_incremental_cron),
    '^[0-9]+[[:space:]]+',
    (incremental_minute + 10)::text || ' '
  );
  vehicle_full_cron := pg_catalog.regexp_replace(
    pg_catalog.btrim(p_full_cron),
    '^[0-9]+[[:space:]]+',
    (full_minute + 10)::text || ' '
  );

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
    'client-sync-incremental-vehicles',
    vehicle_incremental_cron,
    $cron$select private.enqueue_clients_sync_phase('incremental', 'vehicles');$cron$
  );
  perform cron.schedule(
    'client-sync-full-clients',
    p_full_cron,
    $cron$select private.enqueue_clients_sync_phase('full', 'clients');$cron$
  );
  perform cron.schedule(
    'client-sync-full-vehicles',
    vehicle_full_cron,
    $cron$select private.enqueue_clients_sync_phase('full', 'vehicles');$cron$
  );
end;
$function$;

revoke all on function private.remove_clients_sync_cron()
from public, anon, authenticated, service_role;
grant execute on function private.remove_clients_sync_cron()
to service_role;

revoke all on function private.configure_clients_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.configure_clients_sync_cron(text, text, text, text)
to service_role;

comment on function private.enqueue_clients_sync_phase(text, text) is
  'Enfileira uma fase limitada de sincronização de clientes usando segredos do Vault.';

comment on function private.configure_clients_sync_cron(text, text, text, text) is
  'Agenda clientes e veículos em fases separadas; veículos iniciam dez minutos depois.';
