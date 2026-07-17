alter function public.create_commercial_price_table(
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
) set schema private;

revoke all on function private.create_commercial_price_table(
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

grant execute on function private.create_commercial_price_table(
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
) to authenticated, service_role;

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
language sql
security invoker
set search_path = ''
as $$
  select private.create_commercial_price_table(
    p_scope,
    p_unit_id,
    p_unit_name,
    p_grace_minutes,
    p_tolerance_minutes,
    p_cycle_hours,
    p_amount,
    p_starts_at,
    p_ends_at,
    p_status,
    p_notes,
    p_tiers
  );
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

comment on function public.create_commercial_price_table(
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
) is
  'Wrapper RPC sem privilegio elevado; delega a validacao e escrita atomica para private.create_commercial_price_table.';

alter function public.save_commercial_rule_version(
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
) set schema private;

revoke all on function private.save_commercial_rule_version(
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

grant execute on function private.save_commercial_rule_version(
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
) to authenticated, service_role;

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
language sql
security invoker
set search_path = ''
as $$
  select private.save_commercial_rule_version(
    p_type,
    p_target_type,
    p_client_id,
    p_client_name,
    p_vehicle_id,
    p_vehicle_plate,
    p_vehicle_ids,
    p_applies_to_all_units,
    p_unit_ids,
    p_active,
    p_fuel_min_liters,
    p_benefit_hours,
    p_yard_occupancy_threshold,
    p_yard_stale_vehicle_hours,
    p_notes
  );
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

comment on function public.save_commercial_rule_version(
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
) is
  'Wrapper RPC sem privilegio elevado; delega a validacao e escrita atomica para private.save_commercial_rule_version.';

alter function public.set_all_notifications_read_status(boolean)
set schema private;

revoke all on function private.set_all_notifications_read_status(boolean)
from public, anon, authenticated;

grant execute on function private.set_all_notifications_read_status(boolean)
to authenticated, service_role;

create or replace function public.set_all_notifications_read_status(
  is_read boolean
)
returns table(id uuid)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.set_all_notifications_read_status(is_read);
$$;

revoke all on function public.set_all_notifications_read_status(boolean)
from public, anon, authenticated;

grant execute on function public.set_all_notifications_read_status(boolean)
to authenticated;

comment on function public.set_all_notifications_read_status(boolean) is
  'Wrapper RPC sem privilegio elevado; delega a atualizacao propria para private.set_all_notifications_read_status.';
