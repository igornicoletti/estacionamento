-- Harden helper exposure and add atomic database primitives used by Edge Functions.
-- Public internal_* RPCs are callable only by service_role because Edge Functions
-- use the Data API and the private schema is intentionally not exposed.

alter default privileges for role postgres in schema public
revoke execute on functions from public, anon, authenticated;

insert into public.app_permissions (key, label, description)
values (
  'sync.execute',
  'Executar sincronização',
  'Permite iniciar sincronizações manuais com o ERP.'
)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  updated_at = now();

insert into public.app_role_permissions (role_key, permission_key)
values
  ('owner', 'sync.execute'),
  ('admin', 'sync.execute')
on conflict (role_key, permission_key) do nothing;

insert into public.permission_groups (key, label, sort_order)
values ('sync', 'Sincronização', 65)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.permissions (group_id, key, label, description, is_critical, sort_order)
select
  permission_groups.id,
  'sync.execute',
  'Executar sincronização',
  'Permite iniciar sincronizações manuais com o ERP.',
  true,
  65
from public.permission_groups
where permission_groups.key = 'sync'
on conflict (key) do update
set
  description = excluded.description,
  group_id = excluded.group_id,
  is_active = true,
  is_critical = excluded.is_critical,
  label = excluded.label,
  sort_order = excluded.sort_order,
  source = 'system',
  updated_at = now();

insert into public.role_permissions (role, permission_id)
select role_seed.role, permissions.id
from (
  values
    ('owner'::public.app_user_role),
    ('admin'::public.app_user_role)
) as role_seed(role)
join public.permissions on permissions.key = 'sync.execute'
on conflict (role, permission_id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.auth_rate_limits'::regclass
      and conname = 'auth_rate_limits_bucket_key_hash_key'
  ) then
    alter table public.auth_rate_limits
      add constraint auth_rate_limits_bucket_key_hash_key
      unique (bucket, key_hash);
  end if;
end $$;

create or replace function private.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select app_user.id
  from public.app_users app_user
  where app_user.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.current_app_user_role()
returns public.app_user_role
language sql
stable
security definer
set search_path = ''
as $$
  select app_user.role
  from public.app_users app_user
  where app_user.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.has_current_user_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.app_users app_user
      join public.app_role_permissions role_permission
        on role_permission.role_key = app_user.role
      where app_user.auth_user_id = (select auth.uid())
        and app_user.status = 'active'
        and role_permission.permission_key in ($1, '*')
    ),
    false
  );
$$;

create or replace function private.current_user_permissions()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    array_agg(distinct role_permission.permission_key order by role_permission.permission_key),
    array[]::text[]
  )
  from public.app_users app_user
  join public.app_role_permissions role_permission
    on role_permission.role_key = app_user.role
  where app_user.auth_user_id = (select auth.uid())
    and app_user.status = 'active';
$$;

create or replace function private.can_read_app_users()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_current_user_permission('users.read');
$$;

create or replace function private.can_manage_app_users()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_current_user_permission('users.manage');
$$;

create or replace function private.can_read_permissions()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_current_user_permission('permissions.read');
$$;

create or replace function private.can_manage_target_app_user(target_auth_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with actor as (
    select app_user.role
    from public.app_users app_user
    where app_user.auth_user_id = (select auth.uid())
      and app_user.status = 'active'
    limit 1
  ),
  target_user as (
    select app_user.role
    from public.app_users app_user
    where app_user.auth_user_id = target_auth_user_id
    limit 1
  )
  select coalesce(
    private.has_current_user_permission('users.manage')
    and exists (
      select 1
      from actor
      left join target_user on true
      where actor.role = 'owner'
        or (
          actor.role = 'admin'
          and coalesce(target_user.role::text, 'operator') not in ('owner', 'admin')
        )
    ),
    false
  );
$$;

revoke all on function private.current_app_user_id() from public, anon, authenticated, service_role;
revoke all on function private.current_app_user_role() from public, anon, authenticated, service_role;
revoke all on function private.has_current_user_permission(text) from public, anon, authenticated, service_role;
revoke all on function private.current_user_permissions() from public, anon, authenticated, service_role;
revoke all on function private.can_read_app_users() from public, anon, authenticated, service_role;
revoke all on function private.can_manage_app_users() from public, anon, authenticated, service_role;
revoke all on function private.can_read_permissions() from public, anon, authenticated, service_role;
revoke all on function private.can_manage_target_app_user(uuid) from public, anon, authenticated, service_role;

grant execute on function private.current_app_user_id() to authenticated, service_role;
grant execute on function private.current_app_user_role() to authenticated, service_role;
grant execute on function private.has_current_user_permission(text) to authenticated, service_role;
grant execute on function private.current_user_permissions() to authenticated, service_role;
grant execute on function private.can_read_app_users() to authenticated, service_role;
grant execute on function private.can_manage_app_users() to authenticated, service_role;
grant execute on function private.can_read_permissions() to authenticated, service_role;
grant execute on function private.can_manage_target_app_user(uuid) to authenticated, service_role;

drop policy if exists "global roles can read app users" on public.app_users;
drop policy if exists "active users can read authorized app users" on public.app_users;
drop policy if exists "users can read self or authorized user directory" on public.app_users;
create policy "authorized users can read app user directory"
on public.app_users
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or (select private.has_current_user_permission('users.read'))
);

drop policy if exists "users can read own unit link" on public.app_user_units;
drop policy if exists "global roles can read unit links" on public.app_user_units;
drop policy if exists "active users can read authorized unit links" on public.app_user_units;
drop policy if exists "users can read own or authorized unit links" on public.app_user_units;
create policy "authorized users can read app user unit links"
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
  or (select private.has_current_user_permission('users.read'))
);

drop policy if exists "authorized users can read permission groups" on public.permission_groups;
create policy "authorized users can read permission groups"
on public.permission_groups
for select
to authenticated
using ((select private.can_read_permissions()));

drop policy if exists "authorized users can read permissions" on public.permissions;
create policy "authorized users can read permissions"
on public.permissions
for select
to authenticated
using ((select private.can_read_permissions()));

drop policy if exists "authorized users can read role permissions" on public.role_permissions;
create policy "authorized users can read role permissions"
on public.role_permissions
for select
to authenticated
using ((select private.can_read_permissions()));

revoke all on function public.current_app_user_id() from public, anon, authenticated;
revoke all on function public.current_app_user_role() from public, anon, authenticated;
revoke all on function public.can_manage_app_users() from public, anon, authenticated;
revoke all on function public.can_manage_target_app_user(uuid) from public, anon, authenticated;
revoke all on function public.can_read_app_users() from public, anon, authenticated;
revoke all on function public.can_read_permissions() from public, anon, authenticated;
revoke all on function public.save_vip_rule_version(
  public.commercial_rule_target_type,
  integer,
  text,
  integer,
  text,
  boolean,
  text[],
  boolean,
  text,
  text
) from public, anon, authenticated;

create or replace function public.internal_record_auth_failed_attempt(
  p_cpf_hmac text,
  p_max_attempts integer default 5,
  p_lock_minutes integer default 15
)
returns table(failed_attempts integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(trim(coalesce(p_cpf_hmac, '')), '') is null then
    raise exception 'cpf hash is required';
  end if;

  return query
    update public.app_users app_user
    set
      failed_attempts = app_user.failed_attempts + 1,
      last_failed_at = now(),
      locked_until = case
        when app_user.failed_attempts + 1 >= p_max_attempts
          then now() + make_interval(mins => p_lock_minutes)
        else app_user.locked_until
      end
    where app_user.cpf_hmac = p_cpf_hmac
    returning app_user.failed_attempts, app_user.locked_until;
end;
$$;

create or replace function public.internal_clear_auth_failed_attempts(
  p_auth_user_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.app_users
  set
    failed_attempts = 0,
    last_failed_at = null,
    locked_until = null
  where auth_user_id = p_auth_user_id;
$$;

create or replace function public.internal_consume_auth_flow(
  p_flow_id uuid,
  p_cpf_hmac text,
  p_allowed_purposes text[] default null
)
returns table(
  id uuid,
  app_user_id uuid,
  purpose text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
    update public.auth_flow_attempts flow_attempt
    set consumed_at = now()
    where flow_attempt.flow_id = p_flow_id
      and flow_attempt.cpf_hmac = p_cpf_hmac
      and flow_attempt.consumed_at is null
      and flow_attempt.expires_at > now()
      and (
        p_allowed_purposes is null
        or flow_attempt.purpose = any(p_allowed_purposes)
      )
    returning flow_attempt.id, flow_attempt.app_user_id, flow_attempt.purpose;
end;
$$;

create or replace function public.internal_consume_auth_rate_limit(
  p_bucket text,
  p_key_hash text,
  p_max_attempts integer,
  p_lock_minutes integer
)
returns table(
  allowed boolean,
  attempts integer,
  locked_until timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempts integer;
  current_locked_until timestamptz;
  next_attempts integer;
  next_locked_until timestamptz;
begin
  if nullif(trim(coalesce(p_bucket, '')), '') is null
    or nullif(trim(coalesce(p_key_hash, '')), '') is null
    or p_max_attempts <= 0
    or p_lock_minutes <= 0 then
    raise exception 'invalid rate limit input';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_bucket || ':' || p_key_hash, 0)
  );

  select auth_rate_limits.attempts, auth_rate_limits.locked_until
  into current_attempts, current_locked_until
  from public.auth_rate_limits
  where bucket = p_bucket
    and key_hash = p_key_hash
  for update;

  if found and current_locked_until is not null and current_locked_until > now() then
    return query select
      false,
      current_attempts,
      current_locked_until,
      greatest(0, ceiling(extract(epoch from current_locked_until - now()))::integer);
    return;
  end if;

  next_attempts := case
    when not found or (current_locked_until is not null and current_locked_until <= now())
      then 1
    else current_attempts + 1
  end;

  next_locked_until := case
    when next_attempts >= p_max_attempts
      then now() + make_interval(mins => p_lock_minutes)
    else null
  end;

  insert into public.auth_rate_limits (
    bucket,
    key_hash,
    attempts,
    first_seen_at,
    last_seen_at,
    locked_until
  )
  values (
    p_bucket,
    p_key_hash,
    next_attempts,
    now(),
    now(),
    next_locked_until
  )
  on conflict (bucket, key_hash)
  do update set
    attempts = excluded.attempts,
    last_seen_at = now(),
    locked_until = excluded.locked_until;

  return query select
    next_locked_until is null,
    next_attempts,
    next_locked_until,
    case
      when next_locked_until is null then 0
      else greatest(0, ceiling(extract(epoch from next_locked_until - now()))::integer)
    end;
end;
$$;

create or replace function public.internal_clear_auth_rate_limit(
  p_bucket text,
  p_key_hash text
)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.auth_rate_limits
  where bucket = p_bucket
    and key_hash = p_key_hash;
$$;

revoke all on function public.internal_record_auth_failed_attempt(text, integer, integer) from public, anon, authenticated;
revoke all on function public.internal_clear_auth_failed_attempts(uuid) from public, anon, authenticated;
revoke all on function public.internal_consume_auth_flow(uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.internal_consume_auth_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.internal_clear_auth_rate_limit(text, text) from public, anon, authenticated;

grant execute on function public.internal_record_auth_failed_attempt(text, integer, integer) to service_role;
grant execute on function public.internal_clear_auth_failed_attempts(uuid) to service_role;
grant execute on function public.internal_consume_auth_flow(uuid, text, text[]) to service_role;
grant execute on function public.internal_consume_auth_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.internal_clear_auth_rate_limit(text, text) to service_role;
