alter table public.commercial_rules
  add column if not exists yard_occupancy_threshold integer,
  add column if not exists yard_stale_vehicle_hours numeric(8, 2);

alter table public.commercial_rules
  drop constraint if exists commercial_rules_check,
  drop constraint if exists commercial_rules_check1,
  drop constraint if exists commercial_rules_check2,
  drop constraint if exists commercial_rules_valid_period,
  drop constraint if exists commercial_rules_valid_type_payload,
  drop constraint if exists commercial_rules_valid_target;

alter table public.commercial_rules
  add constraint commercial_rules_valid_period
  check (ends_at is null or ends_at >= starts_at),
  add constraint commercial_rules_valid_target
  check (
    (target_type = 'client' and client_id is not null)
    or
    (target_type = 'vehicle' and client_id is not null and vehicle_id is not null)
    or
    (
      target_type = 'network'
      and applies_to_all_units = true
      and coalesce(array_length(unit_ids, 1), 0) = 0
    )
    or
    (
      target_type = 'unit'
      and applies_to_all_units = false
      and coalesce(array_length(unit_ids, 1), 0) > 0
    )
  ),
  add constraint commercial_rules_valid_type_payload
  check (
    (
      type = 'vip'
      and target_type in ('client', 'vehicle')
      and client_id is not null
      and client_name is not null
      and fuel_min_liters is null
      and benefit_hours is null
      and yard_occupancy_threshold is null
      and yard_stale_vehicle_hours is null
    )
    or
    (
      type = 'fuel_benefit'
      and target_type in ('network', 'unit')
      and client_id is null
      and client_name is null
      and vehicle_id is null
      and vehicle_plate is null
      and fuel_min_liters is not null
      and fuel_min_liters > 0
      and benefit_hours is not null
      and benefit_hours > 0
      and yard_occupancy_threshold is null
      and yard_stale_vehicle_hours is null
    )
    or
    (
      type = 'yard_cleaning_occupancy'
      and target_type = 'unit'
      and client_id is null
      and client_name is null
      and vehicle_id is null
      and vehicle_plate is null
      and fuel_min_liters is null
      and benefit_hours is null
      and yard_occupancy_threshold is not null
      and yard_occupancy_threshold > 0
      and yard_stale_vehicle_hours is null
    )
    or
    (
      type = 'yard_cleaning_stale_vehicle'
      and target_type in ('network', 'unit')
      and client_id is null
      and client_name is null
      and vehicle_id is null
      and vehicle_plate is null
      and fuel_min_liters is null
      and benefit_hours is null
      and yard_occupancy_threshold is null
      and yard_stale_vehicle_hours is not null
      and yard_stale_vehicle_hours > 0
    )
  );

create index if not exists commercial_rules_unit_scope_idx
on public.commercial_rules(type, target_type, unit_ids)
where ends_at is null;

create or replace function public.save_commercial_rule_version(
  p_type public.commercial_rule_type,
  p_target_type public.commercial_rule_target_type,
  p_client_id integer,
  p_client_name text,
  p_vehicle_id integer,
  p_vehicle_plate text,
  p_applies_to_all_units boolean,
  p_unit_ids text[],
  p_active boolean,
  p_fuel_min_liters numeric,
  p_benefit_hours numeric,
  p_yard_occupancy_threshold integer,
  p_yard_stale_vehicle_hours numeric,
  p_reason text,
  p_notes text
)
returns text
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_id uuid := auth.uid();
  normalized_unit_ids text[] := coalesce(p_unit_ids, '{}'::text[]);
  previous_rule public.commercial_rules%rowtype;
  new_rule_id text := gen_random_uuid()::text;
begin
  if actor_id is null or not private.has_current_user_permission('rules.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  normalized_unit_ids := (
    select coalesce(array_agg(distinct normalized_unit_id order by normalized_unit_id), '{}'::text[])
    from unnest(normalized_unit_ids) as units(normalized_unit_id)
    where nullif(trim(normalized_unit_id), '') is not null
  );

  if p_type = 'vip' then
    if p_target_type not in ('client', 'vehicle') then
      raise exception 'invalid vip target type';
    end if;

    if p_target_type = 'client' then
      select *
      into previous_rule
      from public.commercial_rules
      where type = 'vip'
        and target_type = 'client'
        and client_id = p_client_id
        and ends_at is null
      order by version desc, updated_at desc
      limit 1;
    else
      select *
      into previous_rule
      from public.commercial_rules
      where type = 'vip'
        and target_type = 'vehicle'
        and client_id = p_client_id
        and vehicle_id = p_vehicle_id
        and ends_at is null
      order by version desc, updated_at desc
      limit 1;
    end if;
  else
    if p_target_type = 'unit' and coalesce(array_length(normalized_unit_ids, 1), 0) = 0 then
      raise exception 'unit scope requires at least one unit';
    end if;

    if p_target_type = 'network' and coalesce(array_length(normalized_unit_ids, 1), 0) > 0 then
      raise exception 'network scope cannot include unit ids';
    end if;

    select *
    into previous_rule
    from public.commercial_rules
    where type = p_type
      and target_type = p_target_type
      and unit_ids = normalized_unit_ids
      and ends_at is null
    order by version desc, updated_at desc
    limit 1;
  end if;

  if previous_rule.id is not null then
    update public.commercial_rules
    set
      status = 'inactive',
      ends_at = now(),
      updated_by = actor_id
    where id = previous_rule.id;
  end if;

  insert into public.commercial_rules (
    id,
    type,
    target_type,
    client_id,
    client_name,
    vehicle_id,
    vehicle_plate,
    applies_to_all_vehicles,
    vehicle_ids,
    applies_to_all_units,
    unit_ids,
    fuel_min_liters,
    benefit_hours,
    yard_occupancy_threshold,
    yard_stale_vehicle_hours,
    starts_at,
    status,
    version,
    parent_id,
    reason,
    notes,
    created_by,
    updated_by
  )
  values (
    new_rule_id,
    p_type,
    p_target_type,
    case when p_type = 'vip' then p_client_id else null end,
    case when p_type = 'vip' then nullif(trim(coalesce(p_client_name, '')), '') else null end,
    case when p_type = 'vip' and p_target_type = 'vehicle' then p_vehicle_id else null end,
    case when p_type = 'vip' and p_target_type = 'vehicle' then nullif(trim(coalesce(p_vehicle_plate, '')), '') else null end,
    p_type = 'vip' and p_target_type = 'client',
    case
      when p_type = 'vip' and p_target_type = 'vehicle' and p_vehicle_id is not null then array[p_vehicle_id]
      else '{}'::integer[]
    end,
    case when p_target_type = 'network' then true else coalesce(p_applies_to_all_units, false) end,
    case when p_target_type = 'network' then '{}'::text[] else normalized_unit_ids end,
    case when p_type = 'fuel_benefit' then p_fuel_min_liters else null end,
    case when p_type = 'fuel_benefit' then p_benefit_hours else null end,
    case when p_type = 'yard_cleaning_occupancy' then p_yard_occupancy_threshold else null end,
    case when p_type = 'yard_cleaning_stale_vehicle' then p_yard_stale_vehicle_hours else null end,
    now(),
    case when p_active then 'active' else 'inactive' end,
    coalesce(previous_rule.version, 0) + 1,
    previous_rule.id,
    nullif(trim(coalesce(p_reason, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    actor_id,
    actor_id
  );

  insert into public.audit_events (
    actor,
    actor_user_id,
    event,
    metadata,
    scope,
    success,
    target,
    target_user_id
  )
  select
    app_user.name,
    app_user.auth_user_id,
    'commercial_rule_version_created',
    jsonb_build_object(
      'ruleId', new_rule_id,
      'type', p_type,
      'targetType', p_target_type,
      'active', p_active
    ),
    'system',
    true,
    p_type::text,
    null
  from public.app_users app_user
  where app_user.auth_user_id = actor_id;

  return new_rule_id;
end;
$$;

revoke all on function public.save_commercial_rule_version(
  public.commercial_rule_type,
  public.commercial_rule_target_type,
  integer,
  text,
  integer,
  text,
  boolean,
  text[],
  boolean,
  numeric,
  numeric,
  integer,
  numeric,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.save_commercial_rule_version(
  public.commercial_rule_type,
  public.commercial_rule_target_type,
  integer,
  text,
  integer,
  text,
  boolean,
  text[],
  boolean,
  numeric,
  numeric,
  integer,
  numeric,
  text,
  text
) to authenticated;
