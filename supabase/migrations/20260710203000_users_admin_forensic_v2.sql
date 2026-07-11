create index if not exists app_users_role_status_created_idx
on public.app_users(role, status, created_at desc);

create index if not exists app_users_status_created_idx
on public.app_users(status, created_at desc);

create index if not exists app_users_auth_status_idx
on public.app_users(auth_user_id, status);

create index if not exists app_user_units_app_user_idx
on public.app_user_units(app_user_id);

create index if not exists audit_events_target_user_occurred_idx
on public.audit_events(target_user_id, occurred_at desc);

create index if not exists audit_events_actor_user_occurred_idx
on public.audit_events(actor_user_id, occurred_at desc);

alter table public.app_users enable row level security;
alter table public.app_user_units enable row level security;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select app_user.id
  from public.app_users app_user
  where app_user.auth_user_id = (select auth.uid())
    and app_user.status = 'active'
  limit 1
$$;

create or replace function public.current_app_user_role()
returns public.app_user_role
language sql
stable
security definer
set search_path = public
as $$
  select app_user.role
  from public.app_users app_user
  where app_user.auth_user_id = (select auth.uid())
    and app_user.status = 'active'
  limit 1
$$;

create or replace function public.can_read_app_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_user_role() in ('owner', 'admin', 'auditor', 'manager'), false)
$$;

create or replace function public.can_manage_app_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_user_role() in ('owner', 'admin'), false)
$$;

create or replace function public.can_manage_target_app_user(target_auth_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (select auth.uid()) is null then false
    when target_auth_user_id is null then false
    when target_auth_user_id = (select auth.uid()) then false
    when public.current_app_user_role() = 'owner' then true
    when public.current_app_user_role() = 'admin' then coalesce((
      select target_user.role <> 'owner'
      from public.app_users target_user
      where target_user.auth_user_id = target_auth_user_id
      limit 1
    ), false)
    else false
  end
$$;

create or replace function private.record_admin_user_audit_event(
  audit_event text,
  target_auth_user_id uuid,
  audit_target text,
  audit_success boolean,
  audit_reason text default null,
  audit_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.audit_events (
    scope,
    event,
    actor,
    actor_user_id,
    target,
    target_user_id,
    success,
    severity,
    reason,
    metadata
  )
  values (
    'system',
    audit_event,
    coalesce((select public.current_app_user_id())::text, 'unknown'),
    (select auth.uid()),
    audit_target,
    target_auth_user_id,
    audit_success,
    case when audit_success then 'info'::public.audit_severity else 'warning'::public.audit_severity end,
    audit_reason,
    coalesce(audit_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.current_app_user_id() from public, anon, authenticated;
revoke all on function public.current_app_user_role() from public, anon, authenticated;
revoke all on function public.can_read_app_users() from public, anon, authenticated;
revoke all on function public.can_manage_app_users() from public, anon, authenticated;
revoke all on function public.can_manage_target_app_user(uuid) from public, anon, authenticated;
revoke all on function private.record_admin_user_audit_event(text, uuid, text, boolean, text, jsonb) from public, anon, authenticated;

grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.current_app_user_role() to authenticated;
grant execute on function public.can_read_app_users() to authenticated;
grant execute on function public.can_manage_app_users() to authenticated;
grant execute on function public.can_manage_target_app_user(uuid) to authenticated;
grant execute on function private.record_admin_user_audit_event(text, uuid, text, boolean, text, jsonb) to service_role;

drop policy if exists "users can read self or authorized user directory" on public.app_users;
create policy "users can read self or authorized user directory"
on public.app_users
for select
to authenticated
using (
  ((select auth.uid()) is not null and auth_user_id = (select auth.uid()))
  or public.can_read_app_users()
);

drop policy if exists "users can read own or authorized unit links" on public.app_user_units;
create policy "users can read own or authorized unit links"
on public.app_user_units
for select
to authenticated
using (
  public.can_read_app_users()
  or exists (
    select 1
    from public.app_users app_user
    where app_user.id = app_user_units.app_user_id
      and app_user.auth_user_id = (select auth.uid())
  )
);
