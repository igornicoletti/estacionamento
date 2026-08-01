-- pg_net defaults to a five-second timeout. Full ERP imports legitimately take
-- longer, so every scheduled request must declare a bounded timeout that stays
-- below the Edge Runtime wall-clock limit.
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
    ),
    timeout_milliseconds := 145000
  )
  into request_id;

  return request_id;
end;
$function$;

revoke all on function private.enqueue_clients_sync_phase(text, text)
from public, anon, authenticated, service_role;

create or replace function private.enqueue_units_sync(p_mode text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  request_id bigint;
begin
  if p_mode not in ('incremental', 'full') then
    raise exception 'unsupported units sync mode';
  end if;

  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'sync_project_url'
    ) || '/functions/v1/units-sync',
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'units_sync_secret'
      )
    ),
    body := pg_catalog.jsonb_build_object(
      'mode', p_mode,
      'trigger', 'automatic'
    ),
    timeout_milliseconds := 30000
  )
  into request_id;

  return request_id;
end;
$function$;

revoke all on function private.enqueue_units_sync(text)
from public, anon, authenticated, service_role;

create or replace function private.configure_units_sync_cron(
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
    'units_sync_secret',
    p_sync_secret,
    'Service-to-service secret for scheduled units synchronization.'
  );

  perform private.remove_units_sync_cron();

  perform cron.schedule(
    'unit-sync-incremental',
    p_incremental_cron,
    $cron$select private.enqueue_units_sync('incremental');$cron$
  );
  perform cron.schedule(
    'unit-sync-full',
    p_full_cron,
    $cron$select private.enqueue_units_sync('full');$cron$
  );
end;
$function$;

revoke all on function private.configure_units_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.configure_units_sync_cron(text, text, text, text)
to service_role;

comment on function private.enqueue_clients_sync_phase(text, text) is
  'Enfileira uma fase de clientes com segredo do Vault e timeout explícito de 145 segundos.';

comment on function private.enqueue_units_sync(text) is
  'Enfileira a sincronização de unidades com segredo do Vault e timeout explícito de 30 segundos.';

comment on function private.configure_units_sync_cron(text, text, text, text) is
  'Agenda unidades por helper interno sem credenciais ou payload HTTP no cron.job.';
