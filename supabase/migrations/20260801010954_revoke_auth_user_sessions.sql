create or replace function private.revoke_auth_user_sessions(
  p_auth_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, auth
as $$
declare
  deleted_sessions integer := 0;
begin
  if p_auth_user_id is null then
    return 0;
  end if;

  delete from auth.sessions
  where user_id = p_auth_user_id;

  get diagnostics deleted_sessions = row_count;
  return deleted_sessions;
end;
$$;

revoke all on function private.revoke_auth_user_sessions(uuid)
from public, anon, authenticated;
grant execute on function private.revoke_auth_user_sessions(uuid)
to service_role;

create or replace function public.revoke_auth_user_sessions(
  p_auth_user_id uuid
)
returns integer
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.revoke_auth_user_sessions(p_auth_user_id);
$$;

revoke all on function public.revoke_auth_user_sessions(uuid)
from public, anon, authenticated;
grant execute on function public.revoke_auth_user_sessions(uuid)
to service_role;

comment on function public.revoke_auth_user_sessions(uuid) is
  'Revoga todas as sessões de um usuário Auth. Exclusivo para service_role; Edge Functions não devem passar UUID para auth.admin.signOut, que exige JWT.';
