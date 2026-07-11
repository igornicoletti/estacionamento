create schema if not exists private;

create or replace function private.revoke_auth_sessions(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.sessions
  where user_id = target_user_id;

  delete from auth.refresh_tokens
  where user_id::uuid = target_user_id;
end;
$$;

revoke all on function private.revoke_auth_sessions(uuid) from public;
revoke all on function private.revoke_auth_sessions(uuid) from anon;
revoke all on function private.revoke_auth_sessions(uuid) from authenticated;
grant execute on function private.revoke_auth_sessions(uuid) to service_role;
