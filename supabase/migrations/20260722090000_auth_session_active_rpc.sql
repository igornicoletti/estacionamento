create or replace function public.is_auth_session_active(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.sessions
    where id = p_session_id
  );
$$;

revoke all on function public.is_auth_session_active(uuid) from public;
revoke all on function public.is_auth_session_active(uuid) from anon;
revoke all on function public.is_auth_session_active(uuid) from authenticated;
grant execute on function public.is_auth_session_active(uuid) to service_role;
