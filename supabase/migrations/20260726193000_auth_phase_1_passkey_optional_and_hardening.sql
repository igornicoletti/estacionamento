alter table public.auth_flow_attempts
  add column if not exists claim_token uuid,
  add column if not exists claimed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'auth_flow_attempts_claim_pair_check'
      and conrelid = 'public.auth_flow_attempts'::regclass
  ) then
    alter table public.auth_flow_attempts
      add constraint auth_flow_attempts_claim_pair_check
      check ((claim_token is null) = (claimed_at is null));
  end if;
end;
$$;

create or replace function public.internal_create_password_task(
  p_app_user_id uuid,
  p_cpf_hmac text,
  p_purpose text,
  p_ttl_seconds integer default 600
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_flow_id uuid;
begin
  if p_app_user_id is null or nullif(pg_catalog.btrim(p_cpf_hmac), '') is null then
    raise exception using
      errcode = '22023',
      message = 'invalid_auth_flow_identity';
  end if;

  if p_purpose is null or p_purpose not in ('first_access', 'password_reset') then
    raise exception using
      errcode = '22023',
      message = 'invalid_auth_flow_purpose';
  end if;

  if p_ttl_seconds is null or p_ttl_seconds < 60 or p_ttl_seconds > 1800 then
    raise exception using
      errcode = '22023',
      message = 'invalid_auth_flow_ttl';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_app_user_id::text, 0)
  );

  if exists (
    select 1
    from public.auth_flow_attempts
    where app_user_id = p_app_user_id
      and purpose in ('first_access', 'password_reset')
      and consumed_at is null
      and claim_token is not null
      and claimed_at > now() - interval '5 minutes'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'auth_flow_busy';
  end if;

  update public.auth_flow_attempts
  set
    consumed_at = now(),
    claim_token = null,
    claimed_at = null
  where app_user_id = p_app_user_id
    and purpose in ('first_access', 'password_reset')
    and consumed_at is null;

  insert into public.auth_flow_attempts (
    app_user_id,
    cpf_hmac,
    expires_at,
    purpose
  )
  values (
    p_app_user_id,
    p_cpf_hmac,
    now() + pg_catalog.make_interval(secs => p_ttl_seconds),
    p_purpose
  )
  returning flow_id into created_flow_id;

  return created_flow_id;
end;
$$;

create or replace function public.internal_claim_password_task(
  p_flow_id uuid,
  p_cpf_hmac text,
  p_app_user_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_flow_id uuid;
begin
  if
    p_flow_id is null
    or p_app_user_id is null
    or p_claim_token is null
    or nullif(pg_catalog.btrim(p_cpf_hmac), '') is null
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_auth_flow_claim';
  end if;

  update public.auth_flow_attempts
  set
    claim_token = p_claim_token,
    claimed_at = now()
  where flow_id = p_flow_id
    and cpf_hmac = p_cpf_hmac
    and app_user_id = p_app_user_id
    and purpose in ('first_access', 'password_reset')
    and consumed_at is null
    and expires_at > now()
    and (
      claim_token is null
      or claimed_at is null
      or claimed_at <= now() - interval '5 minutes'
    )
  returning id into claimed_flow_id;

  return claimed_flow_id is not null;
end;
$$;

create or replace function public.internal_release_password_task_claim(
  p_flow_id uuid,
  p_app_user_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_flow_id is null or p_app_user_id is null or p_claim_token is null then
    raise exception using
      errcode = '22023',
      message = 'invalid_auth_flow_claim';
  end if;

  update public.auth_flow_attempts
  set
    claim_token = null,
    claimed_at = null
  where flow_id = p_flow_id
    and app_user_id = p_app_user_id
    and claim_token = p_claim_token
    and consumed_at is null;

  return found;
end;
$$;

create or replace function public.internal_complete_password_task(
  p_flow_id uuid,
  p_cpf_hmac text,
  p_app_user_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed_flow_id uuid;
begin
  if
    p_flow_id is null
    or p_app_user_id is null
    or p_claim_token is null
    or nullif(pg_catalog.btrim(p_cpf_hmac), '') is null
  then
    raise exception using
      errcode = '22023',
      message = 'invalid_auth_flow_claim';
  end if;

  update public.auth_flow_attempts
  set
    consumed_at = now(),
    claim_token = null,
    claimed_at = null
  where flow_id = p_flow_id
    and cpf_hmac = p_cpf_hmac
    and app_user_id = p_app_user_id
    and claim_token = p_claim_token
    and purpose in ('first_access', 'password_reset')
    and consumed_at is null
    and expires_at > now()
  returning id into completed_flow_id;

  if completed_flow_id is null then
    return false;
  end if;

  update public.app_users
  set
    failed_attempts = 0,
    last_failed_at = null,
    locked_until = null,
    status = 'active'::public.app_user_status,
    updated_at = now()
  where id = p_app_user_id
    and status in (
      'pending'::public.app_user_status,
      'password_reset'::public.app_user_status
    );

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'auth_state_transition_failed';
  end if;

  return true;
end;
$$;

revoke all on function public.internal_create_password_task(uuid, text, text, integer)
from public, anon, authenticated;
revoke all on function public.internal_claim_password_task(uuid, text, uuid, uuid)
from public, anon, authenticated;
revoke all on function public.internal_release_password_task_claim(uuid, uuid, uuid)
from public, anon, authenticated;
revoke all on function public.internal_complete_password_task(uuid, text, uuid, uuid)
from public, anon, authenticated;

grant execute on function public.internal_create_password_task(uuid, text, text, integer)
to service_role;
grant execute on function public.internal_claim_password_task(uuid, text, uuid, uuid)
to service_role;
grant execute on function public.internal_release_password_task_claim(uuid, uuid, uuid)
to service_role;
grant execute on function public.internal_complete_password_task(uuid, text, uuid, uuid)
to service_role;

revoke all on function public.internal_consume_auth_flow(uuid, text, text[])
from public, anon, authenticated;
grant execute on function public.internal_consume_auth_flow(uuid, text, text[])
to service_role;

revoke all on function private.record_admin_user_audit_event(
  text,
  uuid,
  text,
  boolean,
  jsonb
)
from public, anon, authenticated;
grant execute on function private.record_admin_user_audit_event(
  text,
  uuid,
  text,
  boolean,
  jsonb
)
to service_role;

update public.app_users
set
  status = 'active'::public.app_user_status,
  updated_at = now()
where status = 'passkey_reset'::public.app_user_status;

create index if not exists app_role_permissions_permission_key_idx
on public.app_role_permissions(permission_key);

create index if not exists auth_flow_attempts_app_user_id_idx
on public.auth_flow_attempts(app_user_id);

create index if not exists auth_flow_attempts_active_claim_idx
on public.auth_flow_attempts(app_user_id, claimed_at)
where consumed_at is null;

create index if not exists commercial_price_tables_created_by_idx
on public.commercial_price_tables(created_by);

create index if not exists commercial_price_tables_parent_id_idx
on public.commercial_price_tables(parent_id);

create index if not exists commercial_price_tables_updated_by_idx
on public.commercial_price_tables(updated_by);

create index if not exists commercial_rules_created_by_idx
on public.commercial_rules(created_by);

create index if not exists commercial_rules_parent_id_idx
on public.commercial_rules(parent_id);

create index if not exists commercial_rules_updated_by_idx
on public.commercial_rules(updated_by);

create index if not exists email_verification_attempts_app_user_id_idx
on public.email_verification_attempts(app_user_id);

create index if not exists notification_events_created_by_app_user_id_idx
on public.notification_events(created_by_app_user_id);

create index if not exists phone_verification_attempts_app_user_id_idx
on public.phone_verification_attempts(app_user_id);

create index if not exists unit_yard_configs_updated_by_idx
on public.unit_yard_configs(updated_by);
