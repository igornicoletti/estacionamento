
-- =============================================================================
-- Migration: unify_permissions_cleanup_cron_passkey_fix
-- Purpose:
--   1. Drop orphaned permission tables (role_permissions, permissions, permission_groups)
--   2. Add cleanup cron for auth_flow_attempts, auth_rate_limits, sync_locks
--   3. Add missing indexes on auth_flow_attempts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. DROP ORPHANED PERMISSION SYSTEM
--    The active system is: app_permissions + app_role_permissions
--    These tables are NOT referenced by any RLS policy or function.
-- ---------------------------------------------------------------------------

-- Drop RLS policies first
DROP POLICY IF EXISTS "authorized users can read role permissions" ON role_permissions;
DROP POLICY IF EXISTS "authorized users can read permissions" ON permissions;
DROP POLICY IF EXISTS "authorized users can read permission groups" ON permission_groups;

-- Drop tables in FK order (role_permissions → permissions → permission_groups)
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS permission_groups CASCADE;

-- ---------------------------------------------------------------------------
-- 2. CLEANUP CRON JOBS
--    Remove expired/consumed rows from transient tables
-- ---------------------------------------------------------------------------

-- Cleanup expired auth flow attempts (consumed or expired > 1 hour ago)
SELECT cron.schedule(
  'cleanup-auth-flow-attempts',
  '0 */6 * * *',  -- every 6 hours
  $$DELETE FROM public.auth_flow_attempts WHERE consumed_at IS NOT NULL OR expires_at < (now() - interval '1 hour')$$
);

-- Cleanup expired rate limit windows (window expired > 1 hour ago)
SELECT cron.schedule(
  'cleanup-auth-rate-limits',
  '0 */6 * * *',  -- every 6 hours
  $$DELETE FROM public.auth_rate_limits WHERE window_end < (now() - interval '1 hour')$$
);

-- Cleanup expired sync locks (expired > 10 minutes ago)
SELECT cron.schedule(
  'cleanup-sync-locks',
  '*/30 * * * *',  -- every 30 minutes
  $$DELETE FROM public.sync_locks WHERE expires_at < (now() - interval '10 minutes')$$
);

-- ---------------------------------------------------------------------------
-- 3. MISSING INDEXES on auth_flow_attempts
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_auth_flow_attempts_cpf_hmac
  ON auth_flow_attempts (cpf_hmac);

CREATE INDEX IF NOT EXISTS idx_auth_flow_attempts_expires_at
  ON auth_flow_attempts (expires_at)
  WHERE consumed_at IS NULL;
;
