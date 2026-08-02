alter table public.app_session_activity
	add column if not exists reviewed_at timestamptz,
	add column if not exists trusted_at timestamptz;

create index if not exists app_session_activity_user_trusted_idx
on public.app_session_activity(auth_user_id, trusted_at desc)
where trusted_at is not null and revoked_at is null;

create or replace function public.get_current_security_posture()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	current_session_id uuid := private.current_auth_session_id();
	current_level text := 'aal1';
	session_rows jsonb := '[]'::jsonb;
begin
	if current_user_id is null
		or current_session_id is null
		or not private.is_current_app_session_active()
	then
		raise insufficient_privilege using message = 'unauthorized';
	end if;

	select coalesce(auth_session.aal::text, 'aal1')
	into current_level
	from auth.sessions auth_session
	where auth_session.id = current_session_id
		and auth_session.user_id = current_user_id;

	select coalesce(
		jsonb_agg(
			jsonb_build_object(
				'createdAt', auth_session.created_at,
				'lastSeenAt', coalesce(
					activity.last_seen_at,
					auth_session.updated_at,
					auth_session.created_at
				),
				'userAgent', auth_session.user_agent,
				'ipAddress', case
					when auth_session.ip is null then null
					else host(auth_session.ip)
				end,
				'aal', auth_session.aal::text,
				'current', auth_session.id = current_session_id,
				'reviewed', activity.reviewed_at is not null,
				'trusted', activity.trusted_at is not null
					and activity.revoked_at is null
			)
			order by auth_session.created_at desc
		),
		'[]'::jsonb
	)
	into session_rows
	from auth.sessions auth_session
	left join public.app_session_activity activity
		on activity.session_id = auth_session.id
	 and activity.auth_user_id = auth_session.user_id
	where auth_session.user_id = current_user_id
		and auth_session.created_at >= now() - interval '30 days'
		and (auth_session.not_after is null or auth_session.not_after > now())
		and activity.revoked_at is null;

	return jsonb_build_object(
		'mfaConfigured', exists (
			select 1
			from auth.mfa_factors factor
			where factor.user_id = current_user_id
				and factor.status::text = 'verified'
				and factor.factor_type::text in ('totp', 'phone')
		),
		'currentLevel', current_level,
		'currentSessionTrusted', exists (
			select 1
			from public.app_session_activity activity
			where activity.session_id = current_session_id
				and activity.auth_user_id = current_user_id
				and activity.trusted_at is not null
				and activity.revoked_at is null
		),
		'recentLoginsReviewed', not exists (
			select 1
			from auth.sessions auth_session
			left join public.app_session_activity activity
				on activity.session_id = auth_session.id
			 and activity.auth_user_id = auth_session.user_id
			where auth_session.user_id = current_user_id
				and auth_session.created_at >= now() - interval '30 days'
				and (auth_session.not_after is null or auth_session.not_after > now())
				and activity.revoked_at is null
				and activity.reviewed_at is null
		),
		'trustedDevicesConfigured', exists (
			select 1
			from public.app_session_activity activity
			join auth.sessions auth_session
				on auth_session.id = activity.session_id
			 and auth_session.user_id = activity.auth_user_id
			where activity.auth_user_id = current_user_id
				and activity.trusted_at is not null
				and activity.revoked_at is null
				and (auth_session.not_after is null or auth_session.not_after > now())
		),
		'sessions', session_rows
	);
end;
$$;

create or replace function public.review_current_security_logins()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	reviewed_time timestamptz := clock_timestamp();
begin
	if current_user_id is null or not private.is_current_app_session_active() then
		raise insufficient_privilege using message = 'unauthorized';
	end if;

	insert into public.app_session_activity (
		session_id,
		auth_user_id,
		last_seen_at,
		created_at,
		reviewed_at
	)
	select
		auth_session.id,
		auth_session.user_id,
		coalesce(auth_session.updated_at, auth_session.created_at, reviewed_time),
		coalesce(auth_session.created_at, reviewed_time),
		reviewed_time
	from auth.sessions auth_session
	where auth_session.user_id = current_user_id
		and auth_session.created_at >= reviewed_time - interval '30 days'
		and (auth_session.not_after is null or auth_session.not_after > reviewed_time)
	on conflict (session_id) do update
	set reviewed_at = excluded.reviewed_at;

	return reviewed_time;
end;
$$;

create or replace function public.trust_current_security_device()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	current_session_id uuid := private.current_auth_session_id();
	trusted_time timestamptz := clock_timestamp();
	session_created_at timestamptz;
begin
	if current_user_id is null
		or current_session_id is null
		or not private.is_current_app_session_active()
	then
		raise insufficient_privilege using message = 'unauthorized';
	end if;

	select auth_session.created_at
	into session_created_at
	from auth.sessions auth_session
	where auth_session.id = current_session_id
		and auth_session.user_id = current_user_id
		and auth_session.aal::text = 'aal2';

	if not found then
		raise insufficient_privilege using message = 'aal2_required';
	end if;

	insert into public.app_session_activity (
		session_id,
		auth_user_id,
		last_seen_at,
		created_at,
		trusted_at
	)
	values (
		current_session_id,
		current_user_id,
		trusted_time,
		coalesce(session_created_at, trusted_time),
		trusted_time
	)
	on conflict (session_id) do update
	set trusted_at = excluded.trusted_at;

	return trusted_time;
end;
$$;

revoke all on function public.get_current_security_posture()
from public, anon, authenticated, service_role;
revoke all on function public.review_current_security_logins()
from public, anon, authenticated, service_role;
revoke all on function public.trust_current_security_device()
from public, anon, authenticated, service_role;

grant execute on function public.get_current_security_posture()
to authenticated;
grant execute on function public.review_current_security_logins()
to authenticated;
grant execute on function public.trust_current_security_device()
to authenticated;

comment on function public.get_current_security_posture() is
	'Returns the authenticated user security posture and active sessions from the last 30 days.';
comment on function public.review_current_security_logins() is
	'Marks the authenticated user active sessions from the last 30 days as reviewed.';
comment on function public.trust_current_security_device() is
	'Trusts the current authenticated session after an AAL2 verification.';
