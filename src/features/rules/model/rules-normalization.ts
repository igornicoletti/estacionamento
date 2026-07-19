import {
  ruleTargetTypeValues,
  ruleTypeValues,
  type RawVipRuleRecord,
  type RuleTargetType,
  type RuleType,
  type VipRuleRecord,
} from "./rules-types"

function isRuleType(value: unknown): value is RuleType {
  return typeof value === "string" && ruleTypeValues.includes(value as RuleType)
}

function isRuleTargetType(value: unknown): value is RuleTargetType {
  return typeof value === "string" && ruleTargetTypeValues.includes(value as RuleTargetType)
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

function asNullableText(value: unknown) {
  const text = asText(value)
  return text.length > 0 ? text : null
}

function asNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const number = asNullableNumber(item)
    return number === null ? [] : [number]
  })
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const text = asText(item)
    return text ? [text] : []
  })
}

function asNullableIsoDate(value: unknown) {
  if (!value) {
    return null
  }

  const date = new Date(value as string)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function normalizeVipRuleRecord(row: RawVipRuleRecord): VipRuleRecord {
  return {
    id: asText(row.id),
    type: isRuleType(row.type) ? row.type : "vip",
    targetType: isRuleTargetType(row.target_type) ? row.target_type : "global",
    clientId: asNullableNumber(row.client_id),
    clientName: asNullableText(row.client_name),
    vehicleId: asNullableNumber(row.vehicle_id),
    vehiclePlate: asNullableText(row.vehicle_plate),
    vehicleIds: asNumberArray(row.vehicle_ids),
    appliesToAllUnits: row.applies_to_all_units === true,
    unitIds: asStringArray(row.unit_ids),
    active: row.active === true,
    fuelMinLiters: asNullableNumber(row.fuel_min_liters),
    benefitHours: asNullableNumber(row.benefit_hours),
    yardOccupancyThreshold: asNullableNumber(row.yard_occupancy_threshold),
    yardStaleVehicleHours: asNullableNumber(row.yard_stale_vehicle_hours),
    notes: asNullableText(row.notes),
    createdAt: asNullableIsoDate(row.created_at),
    updatedAt: asNullableIsoDate(row.updated_at),
  }
}

export function normalizeVipRuleRecords(rows: readonly RawVipRuleRecord[]) {
  return rows
    .map(normalizeVipRuleRecord)
    .filter((record) => record.id.length > 0)
    .sort((first, second) => (second.updatedAt ?? "").localeCompare(first.updatedAt ?? ""))
}
