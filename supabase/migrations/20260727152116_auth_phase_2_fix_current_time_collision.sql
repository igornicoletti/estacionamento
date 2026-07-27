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
  v_now timestamptz := clock_timestamp();
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
      v_now,
      null::timestamptz,
      null::timestamptz,
      policy.enforcement_enabled;
    return;
  end if;

  select auth_session.created_at
  into session_created_at
  from auth.sessions auth_session
  where auth_session.id = current_session_id
    and auth_session.user_id = current_user_id;

  if not found then
    return query select
      'invalid'::text,
      v_now,
      null::timestamptz,
      null::timestamptz,
      policy.enforcement_enabled;
    return;
  end if;

  session_created_at := coalesce(session_created_at, v_now);

  insert into public.app_session_activity (
    session_id,
    auth_user_id,
    last_seen_at,
    created_at
  )
  values (
    current_session_id,
    current_user_id,
    v_now,
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
      v_now,
      null::timestamptz,
      null::timestamptz,
      policy.enforcement_enabled;
    return;
  end if;

  if activity.revoked_at is not null then
    return query select
      'revoked'::text,
      v_now,
      activity.last_seen_at + policy.idle_timeout,
      activity.created_at + policy.absolute_timeout,
      policy.enforcement_enabled;
    return;
  end if;

  if policy.enforcement_enabled
    and activity.created_at + policy.absolute_timeout <= v_now
  then
    return query select
      'absolute_expired'::text,
      v_now,
      activity.last_seen_at + policy.idle_timeout,
      activity.created_at + policy.absolute_timeout,
      true;
    return;
  end if;

  if policy.enforcement_enabled
    and activity.last_seen_at + policy.idle_timeout <= v_now
  then
    return query select
      'idle_expired'::text,
      v_now,
      activity.last_seen_at + policy.idle_timeout,
      activity.created_at + policy.absolute_timeout,
      true;
    return;
  end if;

  update public.app_session_activity
  set
    last_seen_at = case
      when coalesce(p_activity_observed, false) then v_now
      else last_seen_at
    end,
    created_at = least(created_at, session_created_at)
  where session_id = current_session_id
  returning * into activity;

  return query select
    'active'::text,
    v_now,
    activity.last_seen_at + policy.idle_timeout,
    activity.created_at + policy.absolute_timeout,
    policy.enforcement_enabled;
end;
$$;

revoke all on function public.touch_current_auth_session(boolean)
from public, anon, authenticated, service_role;

grant execute on function public.touch_current_auth_session(boolean)
to authenticated;

notify pgrst, 'reload schema';