create or replace function private.get_current_auth_profile()
returns table (
  id uuid,
  auth_user_id uuid,
  name text,
  role_key text,
  role_label text,
  status text,
  permissions text[],
  unit_id text,
  unit_name text,
  phone_masked text,
  cpf_masked text,
  email text,
  avatar_url text,
  passkey_status text
)
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select
    app_user.id,
    app_user.auth_user_id,
    app_user.name,
    app_user.role::text as role_key,
    app_role.label as role_label,
    app_user.status::text as status,
    case
      when app_user.status = 'active' then private.current_user_permissions()
      else array[]::text[]
    end as permissions,
    unit_link.unit_id,
    null::text as unit_name,
    coalesce(app_user.phone_display, app_user.phone_masked) as phone_masked,
    app_user.cpf_masked,
    app_user.email,
    app_user.avatar_url,
    case
      when exists (
        select 1
        from auth.webauthn_credentials credential
        where credential.user_id = app_user.auth_user_id
      )
      then 'active'::text
      else 'inactive'::text
    end as passkey_status
  from public.app_users app_user
  left join public.app_roles app_role
    on app_role.key = app_user.role
  left join public.app_user_units unit_link
    on unit_link.app_user_id = app_user.id
  where app_user.auth_user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function private.get_current_auth_profile() from public, anon, authenticated, service_role;
grant execute on function private.get_current_auth_profile() to authenticated, service_role;

create or replace function public.get_current_auth_profile()
returns table (
  id uuid,
  auth_user_id uuid,
  name text,
  role_key text,
  role_label text,
  status text,
  permissions text[],
  unit_id text,
  unit_name text,
  phone_masked text,
  cpf_masked text,
  email text,
  avatar_url text,
  passkey_status text
)
language sql
stable
security invoker
set search_path = public, private
as $$
  select * from private.get_current_auth_profile();
$$;

revoke all on function public.get_current_auth_profile() from public, anon, authenticated, service_role;
grant execute on function public.get_current_auth_profile() to authenticated;
