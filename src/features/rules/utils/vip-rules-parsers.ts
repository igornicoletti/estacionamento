import { rulesCopy } from "../rules-copy"
import {
  commercialRuleTypeValues,
  commercialRuleTargetTypeValues,
  type CommercialRuleTargetType,
  type CommercialRuleType,
  type VipRule,
} from "../types/vip-rules-types"
import {
  buildCommercialRuleSummary,
  formatRuleUnitScope,
  sortVipRulesByUpdatedAt,
} from "./vip-rules-models"

export interface RawCommercialRuleRow {
  id: string
  type: CommercialRuleType
  target_type: CommercialRuleTargetType
  client_id: number | null
  client_name: string | null
  vehicle_id: number | null
  vehicle_plate: string | null
  applies_to_all_vehicles: boolean | null
  vehicle_ids: number[] | null
  applies_to_all_units: boolean | null
  unit_ids: string[] | null
  fuel_min_liters: number | string | null
  benefit_hours: number | string | null
  yard_occupancy_threshold: number | null
  yard_stale_vehicle_hours: number | string | null
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

function readInteger(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(",", "."))
        : Number.NaN

  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function readNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(",", "."))
        : Number.NaN

  return Number.isFinite(parsed) ? parsed : null
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

function isCommercialRuleType(value: unknown): value is CommercialRuleType {
  return commercialRuleTypeValues.some((type) => type === value)
}

function isCommercialRuleTargetType(value: unknown): value is CommercialRuleTargetType {
  return commercialRuleTargetTypeValues.some((type) => type === value)
}

export function parseVipRule(value: unknown): VipRule | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value.id)
  const ruleType = isCommercialRuleType(value.type) ? value.type : null
  const targetType = isCommercialRuleTargetType(value.target_type)
    ? value.target_type
    : null
  const updatedAt = readString(value.updated_at)

  if (!id || !ruleType || !targetType || !updatedAt) {
    return null
  }

  const clientId = readInteger(value.client_id)
  const vehicleId = readInteger(value.vehicle_id)
  const unitIds = readStringList(value.unit_ids)
  const appliesToAllUnits = readBoolean(value.applies_to_all_units) ?? targetType === "network"

  if (ruleType === "vip" && (!clientId || (targetType === "vehicle" && !vehicleId))) {
    return null
  }

  const baseRule: VipRule = {
    id,
    ruleType,
    targetType,
    clientId: ruleType === "vip" ? clientId : null,
    clientName: ruleType === "vip" ? readNullableString(value.client_name) : null,
    vehicleId: ruleType === "vip" && targetType === "vehicle" ? vehicleId : null,
    vehiclePlate: ruleType === "vip" ? readNullableString(value.vehicle_plate) : null,
    appliesToAllVehicles:
      ruleType === "vip" && targetType === "client"
        ? readBoolean(value.applies_to_all_vehicles) ?? true
        : false,
    vehicleIds: ruleType === "vip" && targetType === "client"
      ? readNumberList(value.vehicle_ids)
      : vehicleId ? [vehicleId] : [],
    appliesToAllUnits,
    unitIds,
    active: value.status === "active",
    fuelMinLiters: ruleType === "fuel_benefit" ? readNumber(value.fuel_min_liters) : null,
    benefitHours: ruleType === "fuel_benefit" ? readNumber(value.benefit_hours) : null,
    yardOccupancyThreshold: ruleType === "yard_cleaning_occupancy"
      ? readInteger(value.yard_occupancy_threshold)
      : null,
    yardStaleVehicleHours: ruleType === "yard_cleaning_stale_vehicle"
      ? readNumber(value.yard_stale_vehicle_hours)
      : null,
    reason: readNullableString(value.reason),
    notes: readNullableString(value.notes),
    ruleSummary: "",
    scopeLabel: "",
    updatedAt,
  }

  return {
    ...baseRule,
    ruleSummary: buildCommercialRuleSummary(baseRule),
    scopeLabel: formatRuleUnitScope(baseRule),
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
