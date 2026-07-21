
    alter function private.set_updated_at_timestamp()
    set search_path = '';

    revoke all privileges on table public.app_users from anon;
    revoke all privileges on table public.app_users from authenticated;
    grant select on table public.app_users to authenticated;
  ;
