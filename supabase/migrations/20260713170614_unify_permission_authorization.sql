create extension if not exists btree_gist;

insert into public.permissions (group_id, key, label, description, is_critical, sort_order)
select permission_groups.id, seed.key, seed.label, seed.description, seed.is_critical, seed.sort_order
from (
  values
    ('prices', 'prices.manage', 'Gerenciar preços', 'Permite criar novas versões de tabelas de preço.', true, 75),
    ('rules', 'rules.manage', 'Gerenciar regras', 'Permite criar novas versões de regras comerciais.', true, 85)
) as seed(group_key, key, label, description, is_critical, sort_order)
join public.permission_groups on permission_groups.key = seed.group_key
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  is_critical = excluded.is_critical,
  sort_order = excluded.sort_order,
  updated_at = now();

with role_permission_seed (role, permission_key) as (
  values
    ('owner'::public.app_user_role, 'prices.manage'),
    ('owner'::public.app_user_role, 'rules.manage'),
    ('admin'::public.app_user_role, 'prices.manage'),
    ('admin'::public.app_user_role, 'rules.manage')
)
insert into public.role_permissions (role, permission_id)
select role_permission_seed.role, permissions.id
from role_permission_seed
join public.permissions on permissions.key = role_permission_seed.permission_key
on conflict (role, permission_id) do nothing;

create or replace function private.current_user_permissions()
returns text[]
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(array_agg(distinct permission.key order by permission.key), array[]::text[])
  from public.app_users app_user
  join public.role_permissions role_permission
    on role_permission.role = app_user.role
  join public.permissions permission
    on permission.id = role_permission.permission_id
  where app_user.auth_user_id = (select auth.uid())
    and app_user.status = 'active';
$$;

revoke all on function private.current_user_permissions() from public, anon, authenticated, service_role;
grant execute on function private.current_user_permissions() to authenticated, service_role;

create or replace function private.has_current_user_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(permission_key = any(private.current_user_permissions()), false);
$$;

revoke all on function private.has_current_user_permission(text) from public, anon, authenticated, service_role;
grant execute on function private.has_current_user_permission(text) to authenticated, service_role;

alter table public.commercial_price_tables
  drop constraint if exists commercial_price_tables_active_network_no_overlap;

alter table public.commercial_price_tables
  add constraint commercial_price_tables_active_network_no_overlap
  exclude using gist (
    tstzrange(starts_at, coalesce(ends_at, 'infinity'::timestamptz), '[)') with &&
  )
  where (status = 'active' and scope = 'network');

alter table public.commercial_price_tables
  drop constraint if exists commercial_price_tables_active_unit_no_overlap;

alter table public.commercial_price_tables
  add constraint commercial_price_tables_active_unit_no_overlap
  exclude using gist (
    unit_id with =,
    tstzrange(starts_at, coalesce(ends_at, 'infinity'::timestamptz), '[)') with &&
  )
  where (status = 'active' and scope = 'unit');

drop policy if exists "commercial readers can read price tables" on public.commercial_price_tables;
drop policy if exists "commercial managers can insert price tables" on public.commercial_price_tables;
drop policy if exists "commercial managers can update price tables" on public.commercial_price_tables;
drop policy if exists "commercial managers can delete price tables" on public.commercial_price_tables;

create policy "commercial readers can read price tables"
on public.commercial_price_tables
for select
to authenticated
using (private.has_current_user_permission('prices.read'));

create policy "commercial managers can insert price tables"
on public.commercial_price_tables
for insert
to authenticated
with check (private.has_current_user_permission('prices.manage'));

create policy "commercial managers can update price tables"
on public.commercial_price_tables
for update
to authenticated
using (private.has_current_user_permission('prices.manage'))
with check (private.has_current_user_permission('prices.manage'));

create policy "commercial managers can delete price tables"
on public.commercial_price_tables
for delete
to authenticated
using (private.has_current_user_permission('prices.manage'));

drop policy if exists "commercial readers can read price tiers" on public.commercial_price_tiers;
drop policy if exists "commercial managers can insert price tiers" on public.commercial_price_tiers;
drop policy if exists "commercial managers can update price tiers" on public.commercial_price_tiers;
drop policy if exists "commercial managers can delete price tiers" on public.commercial_price_tiers;

create policy "commercial readers can read price tiers"
on public.commercial_price_tiers
for select
to authenticated
using (private.has_current_user_permission('prices.read'));

create policy "commercial managers can insert price tiers"
on public.commercial_price_tiers
for insert
to authenticated
with check (private.has_current_user_permission('prices.manage'));

create policy "commercial managers can update price tiers"
on public.commercial_price_tiers
for update
to authenticated
using (private.has_current_user_permission('prices.manage'))
with check (private.has_current_user_permission('prices.manage'));

create policy "commercial managers can delete price tiers"
on public.commercial_price_tiers
for delete
to authenticated
using (private.has_current_user_permission('prices.manage'));

drop policy if exists "commercial readers can read rules" on public.commercial_rules;
drop policy if exists "commercial managers can insert rules" on public.commercial_rules;
drop policy if exists "commercial managers can update rules" on public.commercial_rules;
drop policy if exists "commercial managers can delete rules" on public.commercial_rules;

create policy "commercial readers can read rules"
on public.commercial_rules
for select
to authenticated
using (private.has_current_user_permission('rules.read'));

create policy "commercial managers can insert rules"
on public.commercial_rules
for insert
to authenticated
with check (private.has_current_user_permission('rules.manage'));

create policy "commercial managers can update rules"
on public.commercial_rules
for update
to authenticated
using (private.has_current_user_permission('rules.manage'))
with check (private.has_current_user_permission('rules.manage'));

create policy "commercial managers can delete rules"
on public.commercial_rules
for delete
to authenticated
using (private.has_current_user_permission('rules.manage'));

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
  p_reason text,
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
    reason,
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
    nullif(trim(coalesce(p_reason, '')), ''),
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
  text,
  jsonb
) to authenticated;

create or replace function public.save_vip_rule_version(
  p_target_type public.commercial_rule_target_type,
  p_client_id integer,
  p_client_name text,
  p_vehicle_id integer,
  p_vehicle_plate text,
  p_applies_to_all_units boolean,
  p_unit_ids text[],
  p_active boolean,
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
  previous_rule public.commercial_rules%rowtype;
  new_rule_id text := gen_random_uuid()::text;
begin
  if actor_id is null or not private.has_current_user_permission('rules.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

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
    'vip',
    p_target_type,
    p_client_id,
    p_client_name,
    case when p_target_type = 'vehicle' then p_vehicle_id else null end,
    case when p_target_type = 'vehicle' then p_vehicle_plate else null end,
    p_target_type = 'client',
    case when p_target_type = 'vehicle' and p_vehicle_id is not null then array[p_vehicle_id] else '{}'::integer[] end,
    p_applies_to_all_units,
    coalesce(p_unit_ids, '{}'::text[]),
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
    'vip_rule_version_created',
    jsonb_build_object('ruleId', new_rule_id, 'targetType', p_target_type, 'active', p_active),
    'system',
    true,
    p_client_name,
    null
  from public.app_users app_user
  where app_user.auth_user_id = actor_id;

  return new_rule_id;
end;
$$;

revoke all on function public.save_vip_rule_version(
  public.commercial_rule_target_type,
  integer,
  text,
  integer,
  text,
  boolean,
  text[],
  boolean,
  text,
  text
) from public, anon, authenticated;
grant execute on function public.save_vip_rule_version(
  public.commercial_rule_target_type,
  integer,
  text,
  integer,
  text,
  boolean,
  text[],
  boolean,
  text,
  text
) to authenticated;
