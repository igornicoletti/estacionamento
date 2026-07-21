import { z } from "zod"

import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { clientsCopy } from "../constants/clients-copy"
import {
  normalizeClientVipRuleRecords,
  type ClientVipRuleRecord,
  type RawClientVipRuleRecord,
} from "../model"

const CLIENT_VIP_RULES_SELECT = [
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
  "status",
  "ends_at",
  "updated_at",
].join(",")

const supabaseResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z.unknown().nullable(),
}).passthrough()

const rawClientVipRuleRecordSchema = z.object({
  id: z.unknown(),
  type: z.unknown(),
  target_type: z.unknown(),
  client_id: z.unknown(),
  client_name: z.unknown(),
  vehicle_id: z.unknown(),
  vehicle_plate: z.unknown(),
  vehicle_ids: z.unknown(),
  applies_to_all_units: z.unknown(),
  unit_ids: z.unknown(),
  status: z.unknown(),
  ends_at: z.unknown(),
  updated_at: z.unknown(),
})

const rawClientVipRuleRecordsSchema = z.array(rawClientVipRuleRecordSchema)

function parseSupabaseResponse(value: unknown, errorMessage: string) {
  const result = supabaseResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(errorMessage, { cause: result.error })
  }

  if (result.data.error) {
    throw new Error(errorMessage, { cause: result.data.error })
  }

  return result.data.data
}

function parseClientVipRuleRows(value: unknown): readonly RawClientVipRuleRecord[] {
  const result = rawClientVipRuleRecordsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(clientsCopy.errors.vipRulesLoad, { cause: result.error })
  }

  return result.data
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(clientsCopy.errors.vipRulesUnavailable)
  }

  return supabase
}

const MOCK_VIP_RULES_STORAGE_KEY = "rmc.clients.mock-vip-rules"
const mockVipRulesMemoryStore: RawClientVipRuleRecord[] = []

function readMockVipRules(): RawClientVipRuleRecord[] {
  if (typeof window === "undefined") {
    return [...mockVipRulesMemoryStore]
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(MOCK_VIP_RULES_STORAGE_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed as RawClientVipRuleRecord[] : []
  } catch {
    return []
  }
}

function writeMockVipRules(rules: readonly RawClientVipRuleRecord[]) {
  mockVipRulesMemoryStore.splice(0, mockVipRulesMemoryStore.length, ...rules)

  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(MOCK_VIP_RULES_STORAGE_KEY, JSON.stringify(rules))
  } catch {
    /* noop */
  }
}

function upsertMockVipRule(input: {
  targetType: "client" | "vehicle"
  clientId: number
  clientName: string
  vehicleId: number | null
  vehiclePlate: string | null
  enabled: boolean
}) {
  const rules = readMockVipRules()
  const existingIndex = rules.findIndex((rule) => {
    if (input.targetType === "client") {
      return rule.target_type === "client" && rule.client_id === input.clientId
    }
    return rule.target_type === "vehicle" && rule.vehicle_id === input.vehicleId
  })

  const newRule: RawClientVipRuleRecord = {
    id: existingIndex >= 0 ? rules[existingIndex].id : `mock-vip-${Date.now()}`,
    type: "vip",
    target_type: input.targetType,
    client_id: input.clientId,
    client_name: input.clientName,
    vehicle_id: input.vehicleId,
    vehicle_plate: input.vehiclePlate,
    vehicle_ids: input.vehicleId ? [input.vehicleId] : [],
    applies_to_all_units: true,
    unit_ids: [],
    status: input.enabled ? "active" : "inactive",
    ends_at: null,
    updated_at: new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    rules[existingIndex] = newRule
  } else {
    rules.unshift(newRule)
  }

  writeMockVipRules(rules)
}

export async function listClientVipRules(): Promise<ClientVipRuleRecord[]> {
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    return normalizeClientVipRuleRecords(readMockVipRules())
  }

  const supabase = getSupabaseOrThrow()
  const response: unknown = await supabase
    .from("commercial_rules")
    .select(CLIENT_VIP_RULES_SELECT)
    .eq("type", "vip")
    .order("updated_at", { ascending: false })
    .limit(501)
  const data = parseSupabaseResponse(response, clientsCopy.errors.vipRulesLoad)

  return normalizeClientVipRuleRecords(parseClientVipRuleRows(data))
}

export async function toggleClientVipRule(input: {
  clientId: number
  clientName: string
  enabled: boolean
}): Promise<void> {
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    upsertMockVipRule({
      targetType: "client",
      clientId: input.clientId,
      clientName: input.clientName,
      vehicleId: null,
      vehiclePlate: null,
      enabled: input.enabled,
    })
    return
  }

  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.rpc("save_commercial_rule_version", {
    p_type: "vip",
    p_target_type: "client",
    p_client_id: input.clientId,
    p_client_name: input.clientName,
    p_vehicle_id: null,
    p_vehicle_plate: null,
    p_vehicle_ids: [],
    p_applies_to_all_units: true,
    p_unit_ids: [],
    p_active: input.enabled,
    p_fuel_min_liters: null,
    p_benefit_hours: null,
    p_yard_occupancy_threshold: null,
    p_yard_stale_vehicle_hours: null,
    p_reason: null,
    p_notes: null,
  })

  if (error) {
    throw new Error(clientsCopy.feedback.clientVip.error, { cause: error })
  }
}

export async function toggleVehicleVipRule(input: {
  clientId: number
  clientName: string
  enabled: boolean
  vehicleId: number
  vehiclePlate: string
}): Promise<void> {
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    upsertMockVipRule({
      targetType: "vehicle",
      clientId: input.clientId,
      clientName: input.clientName,
      vehicleId: input.vehicleId,
      vehiclePlate: input.vehiclePlate,
      enabled: input.enabled,
    })
    return
  }

  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.rpc("save_commercial_rule_version", {
    p_type: "vip",
    p_target_type: "vehicle",
    p_client_id: input.clientId,
    p_client_name: input.clientName,
    p_vehicle_id: input.vehicleId,
    p_vehicle_plate: input.vehiclePlate,
    p_vehicle_ids: [input.vehicleId],
    p_applies_to_all_units: true,
    p_unit_ids: [],
    p_active: input.enabled,
    p_fuel_min_liters: null,
    p_benefit_hours: null,
    p_yard_occupancy_threshold: null,
    p_yard_stale_vehicle_hours: null,
    p_reason: null,
    p_notes: null,
  })

  if (error) {
    throw new Error(clientsCopy.feedback.vehicleVip.error, { cause: error })
  }
}
