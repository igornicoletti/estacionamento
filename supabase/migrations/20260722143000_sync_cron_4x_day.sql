-- =============================================================================
-- Migration: sync_cron_4x_day
-- Purpose: Update sync cron schedules from every 30 min to 4x/day
--   - Full sync 1x/day at 03:00 UTC (unchanged)
--   - Incremental sync 3x/day at 09:00, 15:00, 21:00 UTC
-- =============================================================================

-- Update units sync cron configuration function with new defaults
create or replace function private.configure_units_sync_cron(
  p_project_url text,
  p_sync_secret text,
  p_incremental_cron text default '0 9,15,21 * * *',
  p_full_cron text default '0 3 * * *'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  base_url text;
  incremental_command text;
  full_command text;
begin
  if p_project_url is null or btrim(p_project_url) = '' then
    raise exception 'p_project_url is required';
  end if;

  if p_sync_secret is null or btrim(p_sync_secret) = '' then
    raise exception 'p_sync_secret is required';
  end if;

  base_url := regexp_replace(btrim(p_project_url), '/+$', '');

  perform private.remove_units_sync_cron();

  incremental_command := format(
    'select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''x-sync-secret'', %L), body := %L::jsonb);',
    format('%s/functions/v1/units-sync', base_url),
    p_sync_secret,
    '{"mode":"incremental","trigger":"automatic"}'
  );

  full_command := format(
    'select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''x-sync-secret'', %L), body := %L::jsonb);',
    format('%s/functions/v1/units-sync', base_url),
    p_sync_secret,
    '{"mode":"full","trigger":"automatic"}'
  );

  perform cron.schedule('unit-sync-incremental', p_incremental_cron, incremental_command);
  perform cron.schedule('unit-sync-full', p_full_cron, full_command);
end;
$$;

-- Update clients sync cron configuration function with new defaults
create or replace function private.configure_clients_sync_cron(
  p_project_url text,
  p_sync_secret text,
  p_incremental_cron text default '0 9,15,21 * * *',
  p_full_cron text default '0 3 * * *'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  base_url text;
  incremental_command text;
  full_command text;
begin
  if p_project_url is null or btrim(p_project_url) = '' then
    raise exception 'p_project_url is required';
  end if;

  if p_sync_secret is null or btrim(p_sync_secret) = '' then
    raise exception 'p_sync_secret is required';
  end if;

  base_url := regexp_replace(btrim(p_project_url), '/+$', '');

  perform private.remove_clients_sync_cron();

  incremental_command := format(
    'select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''x-sync-secret'', %L), body := %L::jsonb);',
    format('%s/functions/v1/clients-sync', base_url),
    p_sync_secret,
    '{"mode":"incremental","trigger":"automatic"}'
  );

  full_command := format(
    'select net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'', ''application/json'', ''x-sync-secret'', %L), body := %L::jsonb);',
    format('%s/functions/v1/clients-sync', base_url),
    p_sync_secret,
    '{"mode":"full","trigger":"automatic"}'
  );

  perform cron.schedule('client-sync-incremental', p_incremental_cron, incremental_command);
  perform cron.schedule('client-sync-full', p_full_cron, full_command);
end;
$$;

revoke all on function private.configure_units_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.configure_units_sync_cron(text, text, text, text)
to service_role;

revoke all on function private.configure_clients_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.configure_clients_sync_cron(text, text, text, text)
to service_role;
