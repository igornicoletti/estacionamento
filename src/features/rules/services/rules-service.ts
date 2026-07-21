import { isErpCatalogMockEnabled } from "@/features/erp-mock"
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

const MOCK_RULES_STORAGE_KEY = "rmc.rules.mock-data"

function readMockRules(): RawVipRuleRecord[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(MOCK_RULES_STORAGE_KEY) ?? "[]") as RawVipRuleRecord[]
  } catch {
    return []
  }
}

function writeMockRules(rules: readonly RawVipRuleRecord[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(MOCK_RULES_STORAGE_KEY, JSON.stringify(rules))
  } catch { /* noop */ }
}

const mockSeedRules: RawVipRuleRecord[] = [
  {
    id: "mock-rule-1",
    type: "vip",
    target_type: "client",
    client_id: 1001,
    client_name: "Auto Center Alfa Ltda",
    vehicle_id: null,
    vehicle_plate: null,
    vehicle_ids: [],
    applies_to_all_units: true,
    unit_ids: [],
    active: true,
    fuel_min_liters: null,
    benefit_hours: null,
    yard_occupancy_threshold: null,
    yard_stale_vehicle_hours: null,
    notes: "Cliente VIP desde 2024.",
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-07-15T14:30:00.000Z",
  },
  {
    id: "mock-rule-2",
    type: "vip",
    target_type: "vehicle",
    client_id: 1001,
    client_name: "Auto Center Alfa Ltda",
    vehicle_id: 5001,
    vehicle_plate: "ABC1D23",
    vehicle_ids: [5001],
    applies_to_all_units: true,
    unit_ids: [],
    active: true,
    fuel_min_liters: null,
    benefit_hours: null,
    yard_occupancy_threshold: null,
    yard_stale_vehicle_hours: null,
    notes: null,
    created_at: "2026-06-10T08:00:00.000Z",
    updated_at: "2026-07-18T09:15:00.000Z",
  },
]

function getMockRules(): RawVipRuleRecord[] {
  const stored = readMockRules()
  return stored.length > 0 ? stored : mockSeedRules
}

export async function listVipRules(): Promise<VipRulesResult> {
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    const rows = getMockRules()
    return {
      records: normalizeVipRuleRecords(rows),
      isTruncated: false,
      limit: rows.length,
    }
  }

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
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    const rules = getMockRules()
    const now = new Date().toISOString()
    const existingIndex = payload.id ? rules.findIndex((r) => r.id === payload.id) : -1
    const existingRule = existingIndex >= 0 ? rules[existingIndex] : null
    const newRule: RawVipRuleRecord = {
      id: payload.id ?? `mock-rule-${Date.now()}`,
      type: payload.type,
      target_type: payload.targetType,
      client_id: payload.clientId,
      client_name: payload.clientName,
      vehicle_id: payload.vehicleId,
      vehicle_plate: payload.vehiclePlate,
      vehicle_ids: payload.vehicleIds,
      applies_to_all_units: payload.appliesToAllUnits,
      unit_ids: payload.unitIds,
      active: payload.active,
      fuel_min_liters: payload.fuelMinLiters,
      benefit_hours: payload.benefitHours,
      yard_occupancy_threshold: payload.yardOccupancyThreshold,
      yard_stale_vehicle_hours: payload.yardStaleVehicleHours,
      notes: payload.notes,
      created_at: existingRule?.created_at ?? now,
      updated_at: now,
    }
    if (existingIndex >= 0) {
      rules[existingIndex] = newRule
    } else {
      rules.unshift(newRule)
    }
    writeMockRules(rules)
    return
  }

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
