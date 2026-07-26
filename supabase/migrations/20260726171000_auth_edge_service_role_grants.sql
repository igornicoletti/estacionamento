-- Edge Functions use the service role through PostgREST.
-- RLS is bypassed by service_role, but table privileges still must be explicit
-- after the auth route hardening that revoked broad public/authenticated access.
grant select, insert, update, delete on table public.app_users to service_role;
grant select, insert, update, delete on table public.app_user_units to service_role;
grant select, insert, update, delete on table public.auth_flow_attempts to service_role;
grant select, insert, update, delete on table public.auth_rate_limits to service_role;
grant select, insert, update, delete on table public.audit_events to service_role;
grant select, insert, update, delete on table public.access_recovery_requests to service_role;
grant select, insert, update, delete on table public.phone_verification_attempts to service_role;
grant select, insert, update, delete on table public.email_verification_attempts to service_role;
