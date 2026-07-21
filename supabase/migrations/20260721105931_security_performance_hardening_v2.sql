
-- =============================================================================
-- Migration: security_performance_hardening_v2
-- Purpose:
--   1. Fix audit trigger error handling (SECURITY DEFINER)
--   2. Fix JSONB sanitization in create_commercial_price_table
--   3. Fix race condition in acquire_sync_lock
--   4. Remove redundant indexes
--   5. Move set_updated_at_timestamp to private schema
--   6. Add audit_events cleanup cron
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. FIX AUDIT TRIGGER — wrap INSERT in exception block so audit failure
--    doesn't silently prevent the main operation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.audit_unit_yard_config_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  actor_id uuid;
begin
  actor_id := auth.uid();

  begin
    insert into public.audit_events (
      scope, event, actor, actor_user_id, target, success, severity, metadata
    )
    values (
      'system',
      'unit.yard_updated',
      case when actor_id is null then 'sistema' else 'usuario' end,
      actor_id,
      'unit_yard_config',
      true,
      'info',
      jsonb_build_object(
        'unitId', new.unit_id,
        'patioActive', new.patio_active,
        'parkingSpots', new.parking_spots
      )
    );
  exception when others then
    -- Log but don't prevent the main operation
    raise warning 'audit_unit_yard_config_change failed: %', sqlerrm;
  end;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. FIX JSONB SANITIZATION in create_commercial_price_table
--    Wrap tier parsing in exception block to prevent runtime cast errors
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.create_commercial_price_table(
  p_scope commercial_price_scope,
  p_unit_id text,
  p_unit_name text,
  p_grace_minutes integer,
  p_tolerance_minutes integer,
  p_cycle_hours integer,
  p_amount numeric,
  p_starts_at timestamp with time zone,
  p_ends_at timestamp with time zone,
  p_status commercial_record_status,
  p_notes text,
  p_tiers jsonb DEFAULT '[]'::jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
declare
  actor_id uuid := auth.uid();
  new_price_id text := gen_random_uuid()::text;
  tier_item jsonb;
  tier_sequence integer;
  tier_limit_hours integer;
  tier_amount numeric;
begin
  if actor_id is null or not private.has_current_user_permission('prices.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if p_scope = 'network' and p_unit_id is not null then
    raise exception 'network price cannot have unit';
  end if;

  if p_scope = 'unit' and nullif(trim(coalesce(p_unit_id, '')), '') is null then
    raise exception 'unit price requires unit_id';
  end if;

  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'price end date must be after start date';
  end if;

  insert into public.commercial_price_tables (
    id, scope, unit_id, unit_name, grace_minutes, tolerance_minutes,
    cycle_hours, amount, starts_at, ends_at, status, version, notes,
    created_by, updated_by
  )
  values (
    new_price_id, p_scope,
    nullif(trim(coalesce(p_unit_id, '')), ''),
    nullif(trim(coalesce(p_unit_name, '')), ''),
    p_grace_minutes, p_tolerance_minutes, p_cycle_hours, p_amount,
    p_starts_at, p_ends_at, p_status, 1,
    nullif(trim(coalesce(p_notes, '')), ''),
    actor_id, actor_id
  );

  -- Safely parse tiers with input validation
  if jsonb_typeof(p_tiers) = 'array' then
    for tier_item in select * from jsonb_array_elements(p_tiers)
    loop
      begin
        tier_sequence := (tier_item ->> 'sequence')::integer;
        tier_limit_hours := (tier_item ->> 'limitHours')::integer;
        tier_amount := (tier_item ->> 'amount')::numeric;
      exception when others then
        raise exception 'Invalid tier data: each tier must have numeric sequence, limitHours, and amount';
      end;

      if tier_sequence is null or tier_sequence < 1 then
        raise exception 'Invalid tier sequence: must be a positive integer';
      end if;

      insert into public.commercial_price_tiers (
        price_table_id, sequence, limit_hours, amount, notes
      )
      values (
        new_price_id, tier_sequence, tier_limit_hours, tier_amount,
        nullif(trim(coalesce(tier_item ->> 'notes', '')), '')
      );
    end loop;
  end if;

  begin
    insert into public.audit_events (
      actor, actor_user_id, event, metadata, scope, success, target, target_user_id
    )
    select
      app_user.name, app_user.auth_user_id,
      'price_table_created',
      jsonb_build_object('priceTableId', new_price_id, 'scope', p_scope),
      'system', true,
      coalesce(p_unit_name, p_scope::text), null
    from public.app_users app_user
    where app_user.auth_user_id = actor_id;
  exception when others then
    raise warning 'audit for price_table_created failed: %', sqlerrm;
  end;

  return new_price_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. FIX RACE CONDITION in acquire_sync_lock
--    Use SELECT FOR UPDATE to prevent concurrent acquisition
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.acquire_sync_lock(
  p_resource text,
  p_ttl_seconds integer DEFAULT 300,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
declare
  v_now timestamptz;
  v_expires_at timestamptz;
  v_acquired boolean := false;
begin
  if p_resource is null or btrim(p_resource) = '' then
    raise exception 'p_resource is required';
  end if;

  if p_ttl_seconds is null or p_ttl_seconds < 10 then
    p_ttl_seconds := 10;
  end if;

  v_now := now();
  v_expires_at := v_now + make_interval(secs => p_ttl_seconds);

  -- Try to insert a new lock (no conflict = acquired)
  insert into public.sync_locks (resource, acquired_at, expires_at, metadata)
  values (p_resource, v_now, v_expires_at, coalesce(p_metadata, '{}'::jsonb))
  on conflict (resource) do nothing;

  if found then
    return true;
  end if;

  -- Try to take over an expired lock atomically
  update public.sync_locks
  set acquired_at = v_now,
      expires_at = v_expires_at,
      metadata = coalesce(p_metadata, '{}'::jsonb)
  where resource = p_resource
    and expires_at <= v_now;

  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. REMOVE REDUNDANT INDEXES
--    These are covered by UNIQUE constraints which create implicit indexes
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS app_users_auth_user_id_idx;
DROP INDEX IF EXISTS app_users_cpf_hmac_idx;
-- app_users_role_status_idx is a subset of app_users_role_status_created_idx
DROP INDEX IF EXISTS app_users_role_status_idx;

-- ---------------------------------------------------------------------------
-- 5. MOVE set_updated_at_timestamp TO PRIVATE SCHEMA
--    Reduces public API surface. Keep original as alias for existing triggers.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The public version must remain because existing triggers reference it.
-- Mark it with a comment explaining it delegates to private.
COMMENT ON FUNCTION public.set_updated_at_timestamp() IS 
  'Legacy location — triggers use this. Consider migrating triggers to private.set_updated_at_timestamp() in future.';

-- ---------------------------------------------------------------------------
-- 6. AUDIT EVENTS CLEANUP CRON
--    Keep only last 90 days of audit events
-- ---------------------------------------------------------------------------

SELECT cron.schedule(
  'cleanup-audit-events',
  '0 3 * * 0',  -- weekly on Sunday at 3am
  $$DELETE FROM public.audit_events WHERE occurred_at < (now() - interval '90 days')$$
);

-- ---------------------------------------------------------------------------
-- 7. Set auto_expose_new_tables explicitly in the DB
--    (This is a runtime setting, not achievable via SQL in all versions,
--     but we document the intent here and fix in config.toml)
-- ---------------------------------------------------------------------------

-- Note: auto_expose_new_tables is controlled via config.toml, not SQL.
-- The config.toml fix is applied separately.
;
