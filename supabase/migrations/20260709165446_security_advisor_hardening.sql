create schema if not exists extensions;

drop extension if exists pg_net;
create extension if not exists pg_net with schema extensions;

grant usage on schema extensions to postgres, service_role;
grant usage on schema net to postgres, service_role;

create or replace function public.remove_units_sync_cron()
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

create or replace function public.configure_units_sync_cron(
  p_project_url text,
  p_sync_secret text,
  p_incremental_cron text default '*/30 * * * *',
  p_full_cron text default '0 3 * * *'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
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

  perform public.remove_units_sync_cron();

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

create or replace function public.remove_clients_sync_cron()
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

create or replace function public.configure_clients_sync_cron(
  p_project_url text,
  p_sync_secret text,
  p_incremental_cron text default '*/30 * * * *',
  p_full_cron text default '0 3 * * *'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
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

  perform public.remove_clients_sync_cron();

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

revoke all on function public.remove_units_sync_cron()
from public, anon, authenticated;
revoke all on function public.configure_units_sync_cron(text, text, text, text)
from public, anon, authenticated;
revoke all on function public.remove_clients_sync_cron()
from public, anon, authenticated;
revoke all on function public.configure_clients_sync_cron(text, text, text, text)
from public, anon, authenticated;
grant execute on function public.remove_units_sync_cron() to service_role;
grant execute on function public.configure_units_sync_cron(text, text, text, text) to service_role;
grant execute on function public.remove_clients_sync_cron() to service_role;
grant execute on function public.configure_clients_sync_cron(text, text, text, text) to service_role;

revoke all on function public.current_user_role()
from public, anon, authenticated, service_role;
revoke all on function public.current_user_status()
from public, anon, authenticated, service_role;

create or replace function public.list_app_user_last_access()
returns table (
  auth_user_id uuid,
  last_sign_in_at timestamptz
)
language sql
stable
security invoker
set search_path = public, private
as $$
  select *
  from private.list_app_user_last_access();
$$;

revoke all on function public.list_app_user_last_access()
from public, anon, authenticated;
grant execute on function public.list_app_user_last_access() to authenticated;

drop policy if exists "global roles can read app users" on public.app_users;
drop policy if exists "users can read own app profile" on public.app_users;
drop policy if exists "active users can read authorized app users" on public.app_users;
create policy "active users can read authorized app users"
on public.app_users
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or (
    private.current_user_status() = 'active'
    and private.current_user_role() in ('owner', 'admin', 'auditor')
  )
);

drop policy if exists "global roles can read unit links" on public.app_user_units;
drop policy if exists "users can read own unit link" on public.app_user_units;
drop policy if exists "active users can read authorized unit links" on public.app_user_units;
create policy "active users can read authorized unit links"
on public.app_user_units
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users app_user
    where app_user.id = app_user_units.app_user_id
      and app_user.auth_user_id = (select auth.uid())
  )
  or (
    private.current_user_status() = 'active'
    and private.current_user_role() in ('owner', 'admin', 'auditor')
  )
);

drop policy if exists "privileged roles can read audit" on public.audit_events;
drop policy if exists "authorized roles can read audit events" on public.audit_events;
drop policy if exists "active privileged roles can read audit events" on public.audit_events;
create policy "active privileged roles can read audit events"
on public.audit_events
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin', 'auditor')
);

drop policy if exists "admin roles can read recovery requests" on public.access_recovery_requests;
drop policy if exists "authorized roles can read recovery requests" on public.access_recovery_requests;
drop policy if exists "active admins can read recovery requests" on public.access_recovery_requests;
create policy "active admins can read recovery requests"
on public.access_recovery_requests
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

drop policy if exists "active users can read unit yard config" on public.unit_yard_configs;
drop policy if exists "admins can manage unit yard config" on public.unit_yard_configs;
drop policy if exists "active admins can insert unit yard config" on public.unit_yard_configs;
drop policy if exists "active admins can update unit yard config" on public.unit_yard_configs;
drop policy if exists "active admins can delete unit yard config" on public.unit_yard_configs;
create policy "active users can read unit yard config"
on public.unit_yard_configs
for select
to authenticated
using (private.current_user_status() = 'active');

create policy "active admins can insert unit yard config"
on public.unit_yard_configs
for insert
to authenticated
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "active admins can update unit yard config"
on public.unit_yard_configs
for update
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
)
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

create policy "active admins can delete unit yard config"
on public.unit_yard_configs
for delete
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

drop policy if exists "active users can read erp units" on public.erp_units;
create policy "active users can read erp units"
on public.erp_units
for select
to authenticated
using (private.current_user_status() = 'active');

drop policy if exists "active users can read unit sync runs" on public.unit_sync_runs;
create policy "active users can read unit sync runs"
on public.unit_sync_runs
for select
to authenticated
using (private.current_user_status() = 'active');

drop policy if exists "active users can read unit sync state" on public.unit_sync_state;
create policy "active users can read unit sync state"
on public.unit_sync_state
for select
to authenticated
using (private.current_user_status() = 'active');

drop policy if exists "active users can read active clients" on public.erp_clients;
create policy "active users can read active clients"
on public.erp_clients
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and is_active_120d
);

drop policy if exists "active users can read active client vehicles" on public.erp_client_vehicles;
create policy "active users can read active client vehicles"
on public.erp_client_vehicles
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and client_is_active_120d
);

drop policy if exists "active users can read client sync runs" on public.client_sync_runs;
create policy "active users can read client sync runs"
on public.client_sync_runs
for select
to authenticated
using (private.current_user_status() = 'active');

drop policy if exists "active users can read client sync state" on public.client_sync_state;
create policy "active users can read client sync state"
on public.client_sync_state
for select
to authenticated
using (private.current_user_status() = 'active');

do $$
begin
  if to_regclass('public.notification_deliveries') is not null then
    grant update (read_at) on public.notification_deliveries to authenticated;

    drop policy if exists "users can read delivered notification events" on public.notification_events;
    create policy "users can read delivered notification events"
    on public.notification_events
    for select
    to authenticated
    using (
      private.current_user_status() = 'active'
      and exists (
        select 1
        from public.notification_deliveries delivery
        where delivery.event_id = notification_events.id
          and delivery.recipient_auth_user_id = (select auth.uid())
      )
    );

    drop policy if exists "users can read own notification deliveries" on public.notification_deliveries;
    create policy "users can read own notification deliveries"
    on public.notification_deliveries
    for select
    to authenticated
    using (
      private.current_user_status() = 'active'
      and recipient_auth_user_id = (select auth.uid())
    );

    drop policy if exists "users can update own notification read status" on public.notification_deliveries;
    create policy "users can update own notification read status"
    on public.notification_deliveries
    for update
    to authenticated
    using (
      private.current_user_status() = 'active'
      and recipient_auth_user_id = (select auth.uid())
    )
    with check (
      private.current_user_status() = 'active'
      and recipient_auth_user_id = (select auth.uid())
    );

    create or replace function public.set_notification_read_status(
      delivery_id uuid,
      is_read boolean
    )
    returns table(id uuid)
    language plpgsql
    security invoker
    set search_path = public, private
    as $function$
    begin
      if auth.uid() is null or private.current_user_status() <> 'active' then
        return;
      end if;

      return query
        update public.notification_deliveries delivery
        set read_at = case when is_read then now() else null end
        where delivery.id = set_notification_read_status.delivery_id
          and delivery.recipient_auth_user_id = auth.uid()
        returning delivery.id;
    end;
    $function$;

    create or replace function public.set_notifications_read_status(
      delivery_ids uuid[],
      is_read boolean
    )
    returns table(id uuid)
    language plpgsql
    security invoker
    set search_path = public, private
    as $function$
    begin
      if auth.uid() is null or private.current_user_status() <> 'active' then
        return;
      end if;

      return query
        update public.notification_deliveries delivery
        set read_at = case when is_read then now() else null end
        where delivery.id = any(set_notifications_read_status.delivery_ids)
          and delivery.recipient_auth_user_id = auth.uid()
        returning delivery.id;
    end;
    $function$;

    revoke all on function public.set_notification_read_status(uuid, boolean)
    from public, anon, authenticated;
    revoke all on function public.set_notifications_read_status(uuid[], boolean)
    from public, anon, authenticated;
    grant execute on function public.set_notification_read_status(uuid, boolean)
    to authenticated;
    grant execute on function public.set_notifications_read_status(uuid[], boolean)
    to authenticated;
  end if;
end $$;

drop function if exists public.current_user_role();
drop function if exists public.current_user_status();
