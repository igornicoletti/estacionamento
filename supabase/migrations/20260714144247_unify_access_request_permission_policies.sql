create or replace function public.can_read_permissions()
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$
  select (select auth.uid()) is not null
    and private.has_current_user_permission('permissions.read');
$$;

revoke all on function public.can_read_permissions() from public, anon, authenticated;
grant execute on function public.can_read_permissions() to authenticated;

drop policy if exists "active users can read authorized app users" on public.app_users;
create policy "active users can read authorized app users"
on public.app_users
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or private.has_current_user_permission('users.read')
);

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
  or private.has_current_user_permission('users.read')
);

drop policy if exists "active privileged roles can read audit events" on public.audit_events;
create policy "active privileged roles can read audit events"
on public.audit_events
for select
to authenticated
using (private.has_current_user_permission('audit.read'));

drop policy if exists "active admins can read recovery requests" on public.access_recovery_requests;
drop policy if exists "authorized roles can read recovery requests" on public.access_recovery_requests;
drop policy if exists "admin roles can read recovery requests" on public.access_recovery_requests;
create policy "active users can read access recovery requests"
on public.access_recovery_requests
for select
to authenticated
using (private.has_current_user_permission('access_requests.read'));

drop policy if exists "authorized users can read permission groups" on public.permission_groups;
create policy "authorized users can read permission groups"
on public.permission_groups
for select
to authenticated
using (public.can_read_permissions());

drop policy if exists "authorized users can read permissions" on public.permissions;
create policy "authorized users can read permissions"
on public.permissions
for select
to authenticated
using (public.can_read_permissions());

drop policy if exists "authorized users can read role permissions" on public.role_permissions;
create policy "authorized users can read role permissions"
on public.role_permissions
for select
to authenticated
using (public.can_read_permissions());
