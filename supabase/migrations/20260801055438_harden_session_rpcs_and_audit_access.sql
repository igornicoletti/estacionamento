-- Keep privileged session lifecycle implementations outside the exposed API
-- schema. Public RPCs remain stable, but execute as invoker-only wrappers.
alter function public.touch_current_auth_session(boolean)
set schema private;

revoke all on function private.touch_current_auth_session(boolean)
from public, anon, authenticated, service_role;
grant execute on function private.touch_current_auth_session(boolean)
to authenticated, service_role;

create or replace function public.touch_current_auth_session(
  p_activity_observed boolean default false
)
returns table (
  status text,
  server_time timestamptz,
  idle_expires_at timestamptz,
  absolute_expires_at timestamptz,
  enforcement_enabled boolean
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.touch_current_auth_session(p_activity_observed);
$$;

revoke all on function public.touch_current_auth_session(boolean)
from public, anon, authenticated, service_role;
grant execute on function public.touch_current_auth_session(boolean)
to authenticated;

comment on function public.touch_current_auth_session(boolean) is
  'Wrapper RPC sem privilegio elevado para atualizar e validar a sessao autenticada atual.';

alter function public.revoke_current_auth_session(text)
set schema private;

revoke all on function private.revoke_current_auth_session(text)
from public, anon, authenticated, service_role;
grant execute on function private.revoke_current_auth_session(text)
to authenticated, service_role;

create or replace function public.revoke_current_auth_session(
  p_reason text default 'logout'
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.revoke_current_auth_session(p_reason);
$$;

revoke all on function public.revoke_current_auth_session(text)
from public, anon, authenticated, service_role;
grant execute on function public.revoke_current_auth_session(text)
to authenticated;

comment on function public.revoke_current_auth_session(text) is
  'Wrapper RPC sem privilegio elevado para revogar a sessao autenticada atual.';

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
set search_path = ''
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
    coalesce(app_user.cpf_display, app_user.cpf_masked) as cpf_masked,
    app_user.email,
    app_user.avatar_url,
    case
      when exists (
        select 1
        from auth.webauthn_credentials credential
        where credential.user_id = app_user.auth_user_id
      ) then 'active'::text
      else 'inactive'::text
    end as passkey_status
  from public.app_users app_user
  left join public.app_roles app_role
    on app_role.key = app_user.role
  left join public.app_user_units unit_link
    on unit_link.app_user_id = app_user.id
  where app_user.auth_user_id = (select auth.uid())
    and private.is_current_app_session_active()
  limit 1;
$$;

revoke all on function private.get_current_auth_profile()
from public, anon, authenticated, service_role;
grant execute on function private.get_current_auth_profile()
to authenticated, service_role;

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
set search_path = ''
as $$
  select *
  from private.get_current_auth_profile();
$$;

revoke all on function public.get_current_auth_profile()
from public, anon, authenticated, service_role;
grant execute on function public.get_current_auth_profile()
to authenticated;

comment on function public.get_current_auth_profile() is
  'Wrapper RPC sem privilegio elevado para o perfil da sessao autenticada atual.';

-- The authorization predicate is session-scoped and therefore safe to cache
-- once per statement instead of re-evaluating it for every audit row.
drop policy if exists "active privileged roles can read audit events"
on public.audit_events;

create policy "active privileged roles can read audit events"
on public.audit_events
for select
to authenticated
using ((select private.has_current_user_permission('audit.read')));

-- Matches the deterministic newest-first query used by the audit gateway and
-- supports future cursor pagination without rewriting historical migrations.
create index if not exists audit_events_occurred_id_idx
on public.audit_events (occurred_at desc, id desc);

comment on index public.audit_events_occurred_id_idx is
  'Supports deterministic newest-first audit reads and cursor pagination.';

notify pgrst, 'reload schema';
