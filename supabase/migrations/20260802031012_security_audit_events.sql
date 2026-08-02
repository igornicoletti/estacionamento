create or replace function public.get_current_security_events()
returns table (
	event_id uuid,
	occurred_at timestamptz,
	event_code text,
	success boolean,
	severity text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
begin
	if current_user_id is null
		or not private.is_current_app_session_active()
	then
		raise insufficient_privilege using message = 'unauthorized';
	end if;

	return query
	select
		audit_event.id,
		audit_event.occurred_at,
		audit_event.event,
		audit_event.success,
		audit_event.severity::text
	from public.audit_events audit_event
	where (
			audit_event.actor_user_id = current_user_id
			or audit_event.target_user_id = current_user_id
		)
		and audit_event.event = any (array[
			'access_recovery_requested',
			'access_recovery_reviewed',
			'account_locked',
			'mfa_enabled',
			'passkey_registered',
			'passkey_reset_requested',
			'password_changed',
			'password_reset_requested',
			'phone_change_requested',
			'profile_updated',
			'security_device_trusted',
			'security_logins_reviewed',
			'sessions_revoked',
			'temporary_lock_cleared',
			'user_blocked',
			'user_unblocked'
		]::text[])
	order by audit_event.occurred_at desc, audit_event.id desc
	limit 5;
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
	current_user_name text;
	reviewed_time timestamptz := clock_timestamp();
begin
	if current_user_id is null or not private.is_current_app_session_active() then
		raise insufficient_privilege using message = 'unauthorized';
	end if;

	select coalesce(max(nullif(btrim(app_user.name), '')), 'Usuario autenticado')
	into current_user_name
	from public.app_users app_user
	where app_user.auth_user_id = current_user_id;

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

	insert into public.audit_events (
		scope,
		event,
		actor,
		actor_user_id,
		target,
		target_user_id,
		success,
		severity,
		occurred_at
	)
	values (
		'system',
		'security_logins_reviewed',
		current_user_name,
		current_user_id,
		current_user_name,
		current_user_id,
		true,
		'info',
		reviewed_time
	);

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
	current_user_name text;
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

	select coalesce(max(nullif(btrim(app_user.name), '')), 'Usuario autenticado')
	into current_user_name
	from public.app_users app_user
	where app_user.auth_user_id = current_user_id;

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

	insert into public.audit_events (
		scope,
		event,
		actor,
		actor_user_id,
		target,
		target_user_id,
		success,
		severity,
		occurred_at
	)
	values (
		'system',
		'security_device_trusted',
		current_user_name,
		current_user_id,
		current_user_name,
		current_user_id,
		true,
		'info',
		trusted_time
	);

	return trusted_time;
end;
$$;

create or replace function public.record_current_security_mfa_enabled()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	current_user_name text;
	enabled_time timestamptz := clock_timestamp();
begin
	if current_user_id is null
		or not private.is_current_app_session_active()
		or not exists (
			select 1
			from auth.mfa_factors factor
			where factor.user_id = current_user_id
				and factor.status::text = 'verified'
				and factor.factor_type::text in ('totp', 'phone')
		)
	then
		raise insufficient_privilege using message = 'verified_mfa_required';
	end if;

	select coalesce(max(nullif(btrim(app_user.name), '')), 'Usuario autenticado')
	into current_user_name
	from public.app_users app_user
	where app_user.auth_user_id = current_user_id;

	insert into public.audit_events (
		scope,
		event,
		actor,
		actor_user_id,
		target,
		target_user_id,
		success,
		severity,
		occurred_at
	)
	values (
		'system',
		'mfa_enabled',
		current_user_name,
		current_user_id,
		current_user_name,
		current_user_id,
		true,
		'info',
		enabled_time
	);

	return enabled_time;
end;
$$;

revoke all on function public.get_current_security_events()
from public, anon, authenticated, service_role;
revoke all on function public.review_current_security_logins()
from public, anon, authenticated, service_role;
revoke all on function public.trust_current_security_device()
from public, anon, authenticated, service_role;
revoke all on function public.record_current_security_mfa_enabled()
from public, anon, authenticated, service_role;

grant execute on function public.get_current_security_events()
to authenticated;
grant execute on function public.review_current_security_logins()
to authenticated;
grant execute on function public.trust_current_security_device()
to authenticated;
grant execute on function public.record_current_security_mfa_enabled()
to authenticated;

comment on function public.get_current_security_events() is
	'Returns up to five allowlisted audit events for the active authenticated user.';
comment on function public.record_current_security_mfa_enabled() is
	'Records successful MFA activation after a verified factor exists.';

notify pgrst, 'reload schema';
