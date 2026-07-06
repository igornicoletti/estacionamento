alter table public.app_users enable row level security;
alter table public.app_user_units enable row level security;
alter table public.auth_flow_attempts enable row level security;
alter table public.auth_rate_limits enable row level security;
alter table public.phone_verification_attempts enable row level security;
alter table public.email_verification_attempts enable row level security;

grant usage on schema public to authenticated;
grant select on public.app_users to authenticated;
grant select on public.app_user_units to authenticated;

drop policy if exists "users can read own app profile" on public.app_users;
create policy "users can read own app profile"
on public.app_users
for select
to authenticated
using ((select auth.uid()) = auth_user_id);

drop policy if exists "global roles can read app users" on public.app_users;
create policy "global roles can read app users"
on public.app_users
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin', 'auditor')
  )
);

drop policy if exists "users can read own unit link" on public.app_user_units;
create policy "users can read own unit link"
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
);

drop policy if exists "global roles can read unit links" on public.app_user_units;
create policy "global roles can read unit links"
on public.app_user_units
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin', 'auditor')
  )
);

revoke all on public.auth_flow_attempts from anon, authenticated;
revoke all on public.auth_rate_limits from anon, authenticated;
revoke all on public.phone_verification_attempts from anon, authenticated;
revoke all on public.email_verification_attempts from anon, authenticated;
