create or replace function private.remove_units_sync_cron()
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  sync_job record;
begin
  for sync_job in
    select jobid
    from cron.job
    where jobname in ('unit-sync-incremental', 'unit-sync-full')
  loop
    perform cron.unschedule(sync_job.jobid);
  end loop;
end;
$$;

create or replace function private.configure_units_sync_cron(
  p_project_url text,
  p_sync_secret text,
  p_incremental_cron text default '*/30 * * * *',
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

create or replace function private.remove_clients_sync_cron()
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  sync_job record;
begin
  for sync_job in
    select jobid
    from cron.job
    where jobname in ('client-sync-incremental', 'client-sync-full')
  loop
    perform cron.unschedule(sync_job.jobid);
  end loop;
end;
$$;

create or replace function private.configure_clients_sync_cron(
  p_project_url text,
  p_sync_secret text,
  p_incremental_cron text default '*/30 * * * *',
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

revoke all on function private.remove_units_sync_cron()
from public, anon, authenticated, service_role;
revoke all on function private.configure_units_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
revoke all on function private.remove_clients_sync_cron()
from public, anon, authenticated, service_role;
revoke all on function private.configure_clients_sync_cron(text, text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.remove_units_sync_cron() to service_role;
grant execute on function private.configure_units_sync_cron(text, text, text, text) to service_role;
grant execute on function private.remove_clients_sync_cron() to service_role;
grant execute on function private.configure_clients_sync_cron(text, text, text, text) to service_role;

drop function if exists public.configure_units_sync_cron(text, text, text, text);
drop function if exists public.remove_units_sync_cron();
drop function if exists public.configure_clients_sync_cron(text, text, text, text);
drop function if exists public.remove_clients_sync_cron();
