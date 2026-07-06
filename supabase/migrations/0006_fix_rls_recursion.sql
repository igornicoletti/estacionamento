-- Fix infinite recursion in app_users RLS policies.
-- The "global roles can read app users" policy was doing a sub-SELECT on app_users
-- from within a policy ON app_users, causing PostgreSQL recursive policy evaluation.
--
-- Solution: Create a security definer function that bypasses RLS to check the
-- caller's role, then use that function in the policy.

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

-- Only service_role and authenticated can call these functions
revoke execute on function public.current_user_role() from anon;
revoke execute on function public.current_user_status() from anon;

-- Fix app_users policies
drop policy if exists "global roles can read app users" on public.app_users;
create policy "global roles can read app users"
on public.app_users
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin', 'auditor')
);

-- Fix app_user_units policies (same recursion through sub-select on app_users)
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

-- Fix audit_events policies (same pattern)
drop policy if exists "privileged roles can read audit" on public.audit_events;
create policy "privileged roles can read audit"
on public.audit_events
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin', 'auditor')
);

-- Fix access_recovery_requests policies
drop policy if exists "admin roles can read recovery requests" on public.access_recovery_requests;
create policy "admin roles can read recovery requests"
on public.access_recovery_requests
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and public.current_user_role() in ('owner', 'admin')
);
