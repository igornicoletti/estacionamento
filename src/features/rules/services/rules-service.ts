import { getSupabaseBrowserClient } from "@/lib"

import { RULES_FETCH_LIMIT, rulesCopy } from "../constants"
import {
  normalizeVipRuleRecords,
  type RawVipRuleRecord,
  type SaveVipRulePayload,
  type VipRuleRecord,
} from "../model"

const RULES_SELECT = [
  "id",
  "type",
  "target_type",
  "client_id",
  "client_name",
  "vehicle_id",
  "vehicle_plate",
  "vehicle_ids",
  "applies_to_all_units",
  "unit_ids",
  "active",
  "fuel_min_liters",
  "benefit_hours",
  "yard_occupancy_threshold",
  "yard_stale_vehicle_hours",
  "notes",
  "created_at",
  "updated_at",
].join(",")

export interface VipRulesResult {
  records: VipRuleRecord[]
  isTruncated: boolean
  limit: number
}

export async function listVipRules(): Promise<VipRulesResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(rulesCopy.feedback.loadError)
  }

  const { data, error } = await supabase
    .from("commercial_rules")
    .select(RULES_SELECT)
    .order("updated_at", { ascending: false })
    .limit(RULES_FETCH_LIMIT + 1)

  if (error) {
    throw new Error(rulesCopy.feedback.loadError, { cause: error })
  }

  const rows = (data ?? []) as unknown as RawVipRuleRecord[]

  return {
    records: normalizeVipRuleRecords(rows.slice(0, RULES_FETCH_LIMIT)),
    isTruncated: rows.length > RULES_FETCH_LIMIT,
    limit: RULES_FETCH_LIMIT,
  }
}

export async function saveVipRule(payload: SaveVipRulePayload) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(rulesCopy.feedback.saveError)
  }

  const { error } = await supabase.rpc("save_commercial_rule_version", {
    p_type: payload.type,
    p_target_type: payload.targetType,
    p_client_id: payload.clientId,
    p_client_name: payload.clientName,
    p_vehicle_id: payload.vehicleId,
    p_vehicle_plate: payload.vehiclePlate,
    p_vehicle_ids: payload.vehicleIds,
    p_applies_to_all_units: payload.appliesToAllUnits,
    p_unit_ids: payload.unitIds,
    p_active: payload.active,
    p_fuel_min_liters: payload.fuelMinLiters,
    p_benefit_hours: payload.benefitHours,
    p_yard_occupancy_threshold: payload.yardOccupancyThreshold,
    p_yard_stale_vehicle_hours: payload.yardStaleVehicleHours,
    p_notes: payload.notes,
  })

  if (error) {
    throw new Error(rulesCopy.feedback.saveError, { cause: error })
  }
}
