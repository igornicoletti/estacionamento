-- Keep credentials out of cron.job while preserving the existing service-to-service
-- authentication contract used by the units and clients sync Edge Functions.
create or replace function private.upsert_sync_cron_secret(
  p_name text,
  p_value text,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  existing_secret_id uuid;
begin
  if p_name not in ('sync_project_url', 'units_sync_secret', 'clients_sync_secret') then
    raise exception 'unsupported sync cron secret name';
  end if;

  if nullif(pg_catalog.btrim(p_value), '') is null then
    raise exception 'sync cron secret value is required';
  end if;

  select secret.id
  into existing_secret_id
  from vault.secrets secret
  where secret.name = p_name;

  if existing_secret_id is null then
    perform vault.create_secret(p_value, p_name, p_description);
  else
    perform vault.update_secret(existing_secret_id, p_value, p_name, p_description);
  end if;
end;
$function$;

revoke all on function private.upsert_sync_cron_secret(text, text, text)
from public, anon, authenticated, service_role;

comment on function private.upsert_sync_cron_secret(text, text, text) is
  'Persiste segredos de cron criptografados no Vault; uso interno das funções de configuração.';

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
  incremental_command text;
  full_command text;
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

  incremental_command := $cron$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'sync_project_url'
      ) || '/functions/v1/units-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'units_sync_secret'
        )
      ),
      body := '{"mode":"incremental","trigger":"automatic"}'::jsonb
    );
  $cron$;

  full_command := $cron$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'sync_project_url'
      ) || '/functions/v1/units-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'units_sync_secret'
        )
      ),
      body := '{"mode":"full","trigger":"automatic"}'::jsonb
    );
  $cron$;

  perform cron.schedule('unit-sync-incremental', p_incremental_cron, incremental_command);
  perform cron.schedule('unit-sync-full', p_full_cron, full_command);
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
  incremental_command text;
  full_command text;
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

  incremental_command := $cron$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'sync_project_url'
      ) || '/functions/v1/clients-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'clients_sync_secret'
        )
      ),
      body := '{"mode":"incremental","trigger":"automatic"}'::jsonb
    );
  $cron$;

  full_command := $cron$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'sync_project_url'
      ) || '/functions/v1/clients-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-sync-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'clients_sync_secret'
        )
      ),
      body := '{"mode":"full","trigger":"automatic"}'::jsonb
    );
  $cron$;

  perform cron.schedule('client-sync-incremental', p_incremental_cron, incremental_command);
  perform cron.schedule('client-sync-full', p_full_cron, full_command);
end;
$function$;

revoke all on function private.configure_units_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.configure_units_sync_cron(text, text, text, text)
to service_role;

revoke all on function private.configure_clients_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.configure_clients_sync_cron(text, text, text, text)
to service_role;

comment on function private.configure_units_sync_cron(text, text, text, text) is
  'Configura cron de unidades com URL e credencial obtidas do Vault em tempo de execução.';

comment on function private.configure_clients_sync_cron(text, text, text, text) is
  'Configura cron de clientes com URL e credencial obtidas do Vault em tempo de execução.';
