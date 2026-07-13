create or replace function public.current_user_role()
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

create or replace function public.current_user_status()
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

revoke execute on function public.current_user_role() from anon;
revoke execute on function public.current_user_status() from anon;

drop policy if exists "global roles can read app users" on public.app_users;
create policy "global roles can read app users"
on public.app_users
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin', 'auditor')
);

drop policy if exists "users can read own unit link" on public.app_user_units;
create policy "users can read own unit link"
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
);

drop policy if exists "global roles can read unit links" on public.app_user_units;
create policy "global roles can read unit links"
on public.app_user_units
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin', 'auditor')
);

drop policy if exists "privileged roles can read audit" on public.audit_events;
create policy "privileged roles can read audit"
on public.audit_events
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin', 'auditor')
);

drop policy if exists "admin roles can read recovery requests" on public.access_recovery_requests;
create policy "admin roles can read recovery requests"
on public.access_recovery_requests
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin')
);
