-- Expose auth.users.last_sign_in_at to the admin panel so the users table
-- can display a real "Último acesso" value instead of a hardcoded null.
--
-- auth.users is not directly queryable from the client, so we wrap the
-- lookup in a SECURITY DEFINER function. Access is gated in two layers:
--   1. EXECUTE is revoked from PUBLIC/anon and granted only to authenticated.
--   2. The function body re-checks the caller's own role/status (mirroring
--      public.current_user_role()/current_user_status() from
--      0006_fix_rls_recursion.sql) before returning any rows.
create or replace function public.list_app_user_last_access()
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
  where public.current_user_status() = 'active'
    and public.current_user_role() in ('owner', 'admin', 'auditor');
$$;

revoke all on function public.list_app_user_last_access() from public;
revoke all on function public.list_app_user_last_access() from anon;
grant execute on function public.list_app_user_last_access() to authenticated;
