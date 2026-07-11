create schema if not exists private;

grant usage on schema private to authenticated, service_role;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text
  from public.app_users
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.current_user_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select status::text
  from public.app_users
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function private.current_user_role() from public, anon;
revoke all on function private.current_user_status() from public, anon;
grant execute on function private.current_user_role() to authenticated, service_role;
grant execute on function private.current_user_status() to authenticated, service_role;

revoke all on function public.current_user_role()
from public, anon, authenticated, service_role;
revoke all on function public.current_user_status()
from public, anon, authenticated, service_role;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at_timestamp()
from public, anon, authenticated, service_role;

revoke all on function public.audit_unit_yard_config_change()
from public, anon, authenticated, service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable()
    from public, anon, authenticated, service_role;
  end if;
end $$;

create or replace function private.list_app_user_last_access()
returns table (
  auth_user_id uuid,
  last_sign_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id as auth_user_id, u.last_sign_in_at
  from auth.users u
  join public.app_users au on au.auth_user_id = u.id
  where private.current_user_status() = 'active'
    and private.current_user_role() in ('owner', 'admin', 'auditor');
$$;

revoke all on function private.list_app_user_last_access()
from public, anon, authenticated;
grant execute on function private.list_app_user_last_access()
to authenticated, service_role;

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
create policy "global roles can read app users"
on public.app_users
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin', 'auditor')
);

drop policy if exists "global roles can read unit links" on public.app_user_units;
create policy "global roles can read unit links"
on public.app_user_units
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin', 'auditor')
);

drop policy if exists "privileged roles can read audit" on public.audit_events;
create policy "privileged roles can read audit"
on public.audit_events
for select
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin', 'auditor')
);

drop policy if exists "admin roles can read recovery requests" on public.access_recovery_requests;
create policy "admin roles can read recovery requests"
on public.access_recovery_requests
for select
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

drop policy if exists "active users can read unit yard config" on public.unit_yard_configs;
create policy "active users can read unit yard config"
on public.unit_yard_configs
for select
to authenticated
using (private.current_user_status() = 'active');

drop policy if exists "admins can manage unit yard config" on public.unit_yard_configs;
create policy "admins can manage unit yard config"
on public.unit_yard_configs
for all
to authenticated
using (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
)
with check (
  private.current_user_status() = 'active'
  and private.current_user_role() in ('owner', 'admin')
);

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
  if to_regclass('public.notification_deliveries') is null then
    return;
  end if;

  create or replace function public.set_notification_read_status(
    delivery_id uuid,
    is_read boolean
  )
  returns table(id uuid)
  language plpgsql
  security definer
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
  security definer
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
end $$;
