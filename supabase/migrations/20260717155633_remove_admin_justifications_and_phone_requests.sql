alter table if exists public.commercial_price_tables
  drop column if exists reason;

alter table if exists public.commercial_rules
  drop column if exists reason;

alter table if exists public.access_recovery_requests
  drop column if exists review_reason;

alter table if exists public.app_users
  drop column if exists pending_phone_display,
  drop column if exists pending_phone_masked;

drop function if exists public.create_commercial_price_table(
  public.commercial_price_scope,
  text,
  text,
  integer,
  integer,
  integer,
  numeric,
  timestamptz,
  timestamptz,
  public.commercial_record_status,
  text,
  text,
  jsonb
);

create or replace function public.create_commercial_price_table(
  p_scope public.commercial_price_scope,
  p_unit_id text,
  p_unit_name text,
  p_grace_minutes integer,
  p_tolerance_minutes integer,
  p_cycle_hours integer,
  p_amount numeric,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_status public.commercial_record_status,
  p_notes text,
  p_tiers jsonb default '[]'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_id uuid := auth.uid();
  new_price_id text := gen_random_uuid()::text;
  tier_item jsonb;
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
    id,
    scope,
    unit_id,
    unit_name,
    grace_minutes,
    tolerance_minutes,
    cycle_hours,
    amount,
    starts_at,
    ends_at,
    status,
    version,
    notes,
    created_by,
    updated_by
  )
  values (
    new_price_id,
    p_scope,
    nullif(trim(coalesce(p_unit_id, '')), ''),
    nullif(trim(coalesce(p_unit_name, '')), ''),
    p_grace_minutes,
    p_tolerance_minutes,
    p_cycle_hours,
    p_amount,
    p_starts_at,
    p_ends_at,
    p_status,
    1,
    nullif(trim(coalesce(p_notes, '')), ''),
    actor_id,
    actor_id
  );

  if jsonb_typeof(p_tiers) = 'array' then
    for tier_item in select * from jsonb_array_elements(p_tiers)
    loop
      insert into public.commercial_price_tiers (
        price_table_id,
        sequence,
        limit_hours,
        amount,
        notes
      )
      values (
        new_price_id,
        (tier_item ->> 'sequence')::integer,
        (tier_item ->> 'limitHours')::integer,
        (tier_item ->> 'amount')::numeric,
        nullif(trim(coalesce(tier_item ->> 'notes', '')), '')
      );
    end loop;
  end if;

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
    'price_table_created',
    jsonb_build_object('priceTableId', new_price_id, 'scope', p_scope),
    'system',
    true,
    coalesce(p_unit_name, p_scope::text),
    null
  from public.app_users app_user
  where app_user.auth_user_id = actor_id;

  return new_price_id;
end;
$$;

revoke all on function public.create_commercial_price_table(
  public.commercial_price_scope,
  text,
  text,
  integer,
  integer,
  integer,
  numeric,
  timestamptz,
  timestamptz,
  public.commercial_record_status,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.create_commercial_price_table(
  public.commercial_price_scope,
  text,
  text,
  integer,
  integer,
  integer,
  numeric,
  timestamptz,
  timestamptz,
  public.commercial_record_status,
  text,
  jsonb
) to authenticated;

drop function if exists public.save_commercial_rule_version(
  public.commercial_rule_type,
  public.commercial_rule_target_type,
  integer,
  text,
  integer,
  text,
  integer[],
  boolean,
  text[],
  boolean,
  numeric,
  numeric,
  integer,
  numeric,
  text,
  text
);

create or replace function public.save_commercial_rule_version(
  p_type public.commercial_rule_type,
  p_target_type public.commercial_rule_target_type,
  p_client_id integer,
  p_client_name text,
  p_vehicle_id integer,
  p_vehicle_plate text,
  p_vehicle_ids integer[],
  p_applies_to_all_units boolean,
  p_unit_ids text[],
  p_active boolean,
  p_fuel_min_liters numeric,
  p_benefit_hours numeric,
  p_yard_occupancy_threshold integer,
  p_yard_stale_vehicle_hours numeric,
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
  normalized_vehicle_ids integer[] := coalesce(p_vehicle_ids, '{}'::integer[]);
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

  normalized_vehicle_ids := (
    select coalesce(array_agg(distinct normalized_vehicle_id order by normalized_vehicle_id), '{}'::integer[])
    from unnest(normalized_vehicle_ids) as vehicles(normalized_vehicle_id)
    where normalized_vehicle_id > 0
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

    if p_type = 'yard_cleaning' and coalesce(array_length(normalized_unit_ids, 1), 0) <> 1 then
      raise exception 'yard cleaning rule requires one unit';
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
      status = 'inactive'::public.commercial_record_status,
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
    p_type = 'vip'
      and p_target_type = 'client'
      and coalesce(array_length(normalized_vehicle_ids, 1), 0) = 0,
    case
      when p_type = 'vip' and p_target_type = 'client' then normalized_vehicle_ids
      when p_type = 'vip' and p_target_type = 'vehicle' and p_vehicle_id is not null then array[p_vehicle_id]
      else '{}'::integer[]
    end,
    case when p_target_type = 'network' then true else coalesce(p_applies_to_all_units, false) end,
    case when p_target_type = 'network' then '{}'::text[] else normalized_unit_ids end,
    case when p_type = 'fuel_benefit' then p_fuel_min_liters else null end,
    case when p_type = 'fuel_benefit' then p_benefit_hours else null end,
    case when p_type in ('yard_cleaning_occupancy', 'yard_cleaning') then p_yard_occupancy_threshold else null end,
    case when p_type in ('yard_cleaning_stale_vehicle', 'yard_cleaning') then p_yard_stale_vehicle_hours else null end,
    now(),
    case
      when p_active then 'active'::public.commercial_record_status
      else 'inactive'::public.commercial_record_status
    end,
    coalesce(previous_rule.version, 0) + 1,
    previous_rule.id,
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
  integer[],
  boolean,
  text[],
  boolean,
  numeric,
  numeric,
  integer,
  numeric,
  text
) from public, anon, authenticated;

grant execute on function public.save_commercial_rule_version(
  public.commercial_rule_type,
  public.commercial_rule_target_type,
  integer,
  text,
  integer,
  text,
  integer[],
  boolean,
  text[],
  boolean,
  numeric,
  numeric,
  integer,
  numeric,
  text
) to authenticated;

drop function if exists private.record_admin_user_audit_event(
  text,
  uuid,
  text,
  boolean,
  text,
  jsonb
);

create or replace function private.record_admin_user_audit_event(
  audit_event text,
  target_auth_user_id uuid,
  audit_target text,
  audit_success boolean,
  audit_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.audit_events (
    actor,
    actor_user_id,
    event,
    metadata,
    scope,
    severity,
    success,
    target,
    target_user_id
  )
  select
    actor.name,
    actor.auth_user_id,
    audit_event,
    coalesce(audit_metadata, '{}'::jsonb),
    'system',
    case when audit_success then 'info'::public.audit_severity else 'warning'::public.audit_severity end,
    audit_success,
    audit_target,
    target_auth_user_id
  from public.app_users actor
  where actor.auth_user_id = (select auth.uid());
end;
$$;

revoke all on function private.record_admin_user_audit_event(
  text,
  uuid,
  text,
  boolean,
  jsonb
) from public, anon, authenticated;

grant execute on function private.record_admin_user_audit_event(
  text,
  uuid,
  text,
  boolean,
  jsonb
) to authenticated, service_role;

create or replace function private.dispatch_audit_notification()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.event = 'access_recovery_requested' then
    perform private.create_notification_event(
      'security',
      'Solicitação de recuperação de acesso',
      'Uma solicitação de recuperação de acesso foi registrada e aguarda análise.',
      '/solicitacoes-acesso',
      array['owner', 'admin']::public.app_user_role[],
      null,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event = 'account_locked' then
    perform private.create_notification_event(
      'security',
      'Conta bloqueada por tentativas inválidas',
      'A conta de ' || new.target || ' foi bloqueada temporariamente após tentativas sem sucesso.',
      '/usuarios',
      array['owner', 'admin', 'auditor']::public.app_user_role[],
      null,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event in (
    'password_reset_requested',
    'passkey_reset_requested',
    'sessions_revoked',
    'user_blocked',
    'user_unblocked',
    'temporary_lock_cleared'
  ) and new.target_user_id is not null then
    perform private.create_notification_event(
      'security',
      case new.event
        when 'password_reset_requested' then 'Redefinição de senha solicitada'
        when 'passkey_reset_requested' then 'Recadastro de passkey solicitado'
        when 'sessions_revoked' then 'Sessões revogadas'
        when 'user_blocked' then 'Usuário bloqueado'
        when 'user_unblocked' then 'Usuário desbloqueado'
        else 'Bloqueio removido'
      end,
      'Uma ação administrativa foi aplicada à sua conta.',
      '/perfil',
      null,
      new.target_user_id,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event in (
    'password_changed',
    'passkey_registered',
    'access_recovery_reviewed'
  ) and new.target_user_id is not null then
    perform private.create_notification_event(
      'security',
      case new.event
        when 'password_changed' then 'Senha alterada'
        when 'passkey_registered' then 'Passkey cadastrada'
        else 'Solicitação de recuperação analisada'
      end,
      'Uma atualização de segurança foi registrada na sua conta.',
      '/perfil',
      null,
      new.target_user_id,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event in ('user_created', 'user_updated') then
    perform private.create_notification_event(
      'system',
      case new.event
        when 'user_created' then 'Usuário criado'
        else 'Usuário atualizado'
      end,
      'O cadastro de ' || new.target || ' foi alterado.',
      '/usuarios',
      array['owner', 'admin', 'auditor']::public.app_user_role[],
      null,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  end if;

  return new;
end;
$$;

revoke all on function private.dispatch_audit_notification() from public, anon, authenticated;
grant execute on function private.dispatch_audit_notification() to service_role;
