import { rulesCopy } from "../rules-copy"
import { type VipRule } from "../types/vip-rules-types"
import { createVipRuleId, sortVipRulesByUpdatedAt } from "./vip-rules-models"

export interface RawCommercialRuleRow {
  id: string
  target_type: "client" | "vehicle" | "network" | "unit"
  client_id: number | null
  client_name: string | null
  vehicle_id: number | null
  vehicle_plate: string | null
  applies_to_all_vehicles: boolean | null
  vehicle_ids: number[] | null
  applies_to_all_units: boolean | null
  unit_ids: string[] | null
  status: "active" | "inactive"
  reason: string | null
  notes: string | null
  updated_at: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : null
}

function readNullableString(value: unknown) {
  const text = readString(value)
  return text && text.length > 0 ? text : null
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null
}

function readStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : []
}

function readNumberList(value: unknown) {
  return Array.isArray(value)
    ? value
      .filter((item): item is number => typeof item === "number" && Number.isFinite(item))
      .map((item) => Math.trunc(item))
      .filter((item) => item > 0)
    : []
}

export function parseVipRule(value: unknown): VipRule | null {
  if (!isRecord(value)) {
    return null
  }

  const targetType =
    value.target_type === "client" || value.target_type === "vehicle"
      ? value.target_type
      : null
  const clientId = readNumber(value.client_id)
  const clientName = readString(value.client_name)
  const vehicleId = readNumber(value.vehicle_id)
  const updatedAt = readString(value.updated_at)

  if (!targetType || !clientId || !clientName || !updatedAt) {
    return null
  }

  if (targetType === "vehicle" && !vehicleId) {
    return null
  }

  const rule: VipRule = {
    id: "",
    targetType,
    clientId,
    clientName,
    vehicleId: targetType === "vehicle" ? vehicleId : null,
    vehiclePlate: readNullableString(value.vehicle_plate),
    appliesToAllVehicles:
      targetType === "client" ? readBoolean(value.applies_to_all_vehicles) ?? true : false,
    vehicleIds: targetType === "client" ? readNumberList(value.vehicle_ids) : vehicleId ? [vehicleId] : [],
    appliesToAllUnits: readBoolean(value.applies_to_all_units) ?? true,
    unitIds: readStringList(value.unit_ids),
    active: value.status === "active",
    reason: readNullableString(value.reason),
    notes: readNullableString(value.notes),
    updatedAt,
  }

  return {
    ...rule,
    id: createVipRuleId(rule),
  }
}

export function parseVipRules(value: unknown): VipRule[] {
  if (!Array.isArray(value)) {
    throw new Error(rulesCopy.feedback.loadError)
  }

  return sortVipRulesByUpdatedAt(
    value
      .map(parseVipRule)
      .filter((rule): rule is VipRule => Boolean(rule))
  )
}
