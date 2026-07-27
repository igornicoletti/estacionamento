create schema if not exists private;

create table if not exists private.auth_session_policy (
  singleton boolean primary key default true check (singleton),
  enforcement_enabled boolean not null default false,
  idle_timeout interval not null default interval '45 minutes'
    check (idle_timeout >= interval '5 minutes'),
  absolute_timeout interval not null default interval '24 hours'
    check (absolute_timeout >= idle_timeout),
  updated_at timestamptz not null default now()
);

revoke all on table private.auth_session_policy
from public, anon, authenticated, service_role;

insert into private.auth_session_policy (
  singleton,
  enforcement_enabled,
  idle_timeout,
  absolute_timeout
)
values (
  true,
  false,
  interval '45 minutes',
  interval '24 hours'
)
on conflict (singleton) do update
set
  idle_timeout = excluded.idle_timeout,
  absolute_timeout = excluded.absolute_timeout,
  updated_at = now();

alter table public.app_session_activity
  add column if not exists revoked_at timestamptz,
  add column if not exists revocation_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_session_activity'::regclass
      and conname = 'app_session_activity_revocation_reason_length_check'
  ) then
    alter table public.app_session_activity
      add constraint app_session_activity_revocation_reason_length_check
      check (
        revocation_reason is null
        or char_length(revocation_reason) between 1 and 80
      );
  end if;
end;
$$;

update public.app_session_activity activity
set created_at = least(activity.created_at, auth_session.created_at)
from auth.sessions auth_session
where auth_session.id = activity.session_id
  and auth_session.user_id = activity.auth_user_id
  and auth_session.created_at is not null
  and activity.created_at > auth_session.created_at;

create index if not exists app_session_activity_active_session_idx
on public.app_session_activity(session_id, auth_user_id)
where revoked_at is null;

create or replace function private.current_auth_session_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  session_value text := nullif(auth.jwt() ->> 'session_id', '');
begin
  if session_value is null then
    return null;
  end if;

  return session_value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function private.is_app_session_active(
  p_session_id uuid,
  p_auth_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from auth.sessions auth_session
      cross join private.auth_session_policy policy
      where auth_session.id = p_session_id
        and auth_session.user_id = p_auth_user_id
        and not exists (
          select 1
          from public.app_session_activity revoked_activity
          where revoked_activity.session_id = auth_session.id
            and revoked_activity.auth_user_id = auth_session.user_id
            and revoked_activity.revoked_at is not null
        )
        and (
          not policy.enforcement_enabled
          or exists (
            select 1
            from public.app_session_activity activity
            where activity.session_id = auth_session.id
              and activity.auth_user_id = auth_session.user_id
              and activity.revoked_at is null
              and activity.last_seen_at + policy.idle_timeout > now()
              and activity.created_at + policy.absolute_timeout > now()
          )
        )
    ),
    false
  );
$$;

create or replace function private.is_current_app_session_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_app_session_active(
    private.current_auth_session_id(),
    auth.uid()
  );
$$;

revoke all on function private.current_auth_session_id()
from public, anon, authenticated, service_role;
revoke all on function private.is_app_session_active(uuid, uuid)
from public, anon, authenticated, service_role;
revoke all on function private.is_current_app_session_active()
from public, anon, authenticated, service_role;

create or replace function public.is_auth_session_active(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select private.is_app_session_active(
        auth_session.id,
        auth_session.user_id
      )
      from auth.sessions auth_session
      where auth_session.id = p_session_id
    ),
    false
  );
$$;

revoke all on function public.is_auth_session_active(uuid)
from public, anon, authenticated, service_role;
grant execute on function public.is_auth_session_active(uuid)
to service_role;

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
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_time timestamptz := clock_timestamp();
  current_user_id uuid := auth.uid();
  current_session_id uuid := private.current_auth_session_id();
  session_created_at timestamptz;
  activity public.app_session_activity%rowtype;
  policy private.auth_session_policy%rowtype;
begin
  select *
  into strict policy
  from private.auth_session_policy
  where singleton;

  if current_user_id is null or current_session_id is null then
    return query select
      'invalid'::text,
      current_time,
      null::timestamptz,
      null::timestamptz,
      policy.enforcement_enabled;
    return;
  end if;

  select coalesce(auth_session.created_at, current_time)
  into session_created_at
  from auth.sessions auth_session
  where auth_session.id = current_session_id
    and auth_session.user_id = current_user_id;

  if not found then
    return query select
      'invalid'::text,
      current_time,
      null::timestamptz,
      null::timestamptz,
      policy.enforcement_enabled;
    return;
  end if;

  insert into public.app_session_activity (
    session_id,
    auth_user_id,
    last_seen_at,
    created_at
  )
  values (
    current_session_id,
    current_user_id,
    current_time,
    session_created_at
  )
  on conflict (session_id) do nothing;

  select *
  into strict activity
  from public.app_session_activity
  where session_id = current_session_id
  for update;

  if activity.auth_user_id <> current_user_id then
    return query select
      'invalid'::text,
      current_time,
      null::timestamptz,
      null::timestamptz,
      policy.enforcement_enabled;
    return;
  end if;

  if activity.revoked_at is not null then
    return query select
      'revoked'::text,
      current_time,
      activity.last_seen_at + policy.idle_timeout,
      activity.created_at + policy.absolute_timeout,
      policy.enforcement_enabled;
    return;
  end if;

  if policy.enforcement_enabled
    and activity.created_at + policy.absolute_timeout <= current_time
  then
    return query select
      'absolute_expired'::text,
      current_time,
      activity.last_seen_at + policy.idle_timeout,
      activity.created_at + policy.absolute_timeout,
      true;
    return;
  end if;

  if policy.enforcement_enabled
    and activity.last_seen_at + policy.idle_timeout <= current_time
  then
    return query select
      'idle_expired'::text,
      current_time,
      activity.last_seen_at + policy.idle_timeout,
      activity.created_at + policy.absolute_timeout,
      true;
    return;
  end if;

  update public.app_session_activity
  set
    last_seen_at = case
      when coalesce(p_activity_observed, false) then current_time
      else last_seen_at
    end,
    created_at = least(created_at, session_created_at)
  where session_id = current_session_id
  returning * into activity;

  return query select
    'active'::text,
    current_time,
    activity.last_seen_at + policy.idle_timeout,
    activity.created_at + policy.absolute_timeout,
    policy.enforcement_enabled;
end;
$$;

create or replace function public.revoke_current_auth_session(
  p_reason text default 'logout'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_session_id uuid := private.current_auth_session_id();
  normalized_reason text := left(
    coalesce(nullif(trim(p_reason), ''), 'logout'),
    80
  );
begin
  if current_user_id is null or current_session_id is null then
    return false;
  end if;

  insert into public.app_session_activity (
    session_id,
    auth_user_id,
    last_seen_at,
    created_at,
    revoked_at,
    revocation_reason
  )
  select
    auth_session.id,
    auth_session.user_id,
    now(),
    coalesce(auth_session.created_at, now()),
    now(),
    normalized_reason
  from auth.sessions auth_session
  where auth_session.id = current_session_id
    and auth_session.user_id = current_user_id
  on conflict (session_id) do update
  set
    revoked_at = coalesce(
      public.app_session_activity.revoked_at,
      excluded.revoked_at
    ),
    revocation_reason = coalesce(
      public.app_session_activity.revocation_reason,
      excluded.revocation_reason
    );

  return found;
end;
$$;

revoke all on function public.touch_current_auth_session(boolean)
from public, anon, authenticated, service_role;
revoke all on function public.revoke_current_auth_session(text)
from public, anon, authenticated, service_role;

grant execute on function public.touch_current_auth_session(boolean)
to authenticated;
grant execute on function public.revoke_current_auth_session(text)
to authenticated;

create or replace function private.current_user_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select app_user.status::text
  from public.app_users app_user
  where app_user.auth_user_id = auth.uid()
    and private.is_current_app_session_active()
  limit 1;
$$;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select app_user.role::text
  from public.app_users app_user
  where app_user.auth_user_id = auth.uid()
    and private.is_current_app_session_active()
  limit 1;
$$;

create or replace function private.current_user_permissions()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    array_agg(
      distinct role_permission.permission_key
      order by role_permission.permission_key
    ),
    array[]::text[]
  )
  from public.app_users app_user
  join public.app_role_permissions role_permission
    on role_permission.role_key = app_user.role
  where app_user.auth_user_id = auth.uid()
    and app_user.status = 'active'
    and private.is_current_app_session_active();
$$;

create or replace function private.has_current_user_permission(
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.is_current_app_session_active()
    and exists (
      select 1
      from public.app_users app_user
      join public.app_role_permissions role_permission
        on role_permission.role_key = app_user.role
      where app_user.auth_user_id = auth.uid()
        and app_user.status = 'active'
        and role_permission.permission_key in ($1, '*')
    ),
    false
  );
$$;

revoke all on function private.current_user_status()
from public, anon;
revoke all on function private.current_user_role()
from public, anon;
revoke all on function private.current_user_permissions()
from public, anon;
revoke all on function private.has_current_user_permission(text)
from public, anon;

grant execute on function private.current_user_status()
to authenticated, service_role;
grant execute on function private.current_user_role()
to authenticated, service_role;
grant execute on function private.current_user_permissions()
to authenticated, service_role;
grant execute on function private.has_current_user_permission(text)
to authenticated, service_role;

drop policy if exists "active app session required" on public.app_users;
create policy "active app session required"
on public.app_users
as restrictive
for all
to authenticated
using (private.current_user_status() = 'active')
with check (private.current_user_status() = 'active');

drop policy if exists "active app session required" on public.app_user_units;
create policy "active app session required"
on public.app_user_units
as restrictive
for all
to authenticated
using (private.current_user_status() = 'active')
with check (private.current_user_status() = 'active');

drop policy if exists "active app session required" on storage.objects;
create policy "active app session required"
on storage.objects
as restrictive
for all
to authenticated
using (private.current_user_status() = 'active')
with check (private.current_user_status() = 'active');

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
security definer
set search_path = ''
as $$
  select *
  from private.get_current_auth_profile()
  where private.is_current_app_session_active();
$$;

revoke all on function public.get_current_auth_profile()
from public, anon, authenticated, service_role;
grant execute on function public.get_current_auth_profile()
to authenticated;
