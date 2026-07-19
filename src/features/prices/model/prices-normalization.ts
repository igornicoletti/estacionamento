import {
  priceScopeValues,
  priceStatusValues,
  type PriceScope,
  type PriceStatus,
  type PriceTableRecord,
  type RawPriceTableRecord,
} from "./prices-types"

function isPriceScope(value: unknown): value is PriceScope {
  return typeof value === "string" && priceScopeValues.includes(value as PriceScope)
}

function isPriceStatus(value: unknown): value is PriceStatus {
  return typeof value === "string" && priceStatusValues.includes(value as PriceStatus)
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

function asNullableText(value: unknown) {
  const text = asText(value)
  return text.length > 0 ? text : null
}

function asNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

function asIsoDate(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  return new Date(0).toISOString()
}

function asNullableIsoDate(value: unknown) {
  if (!value) {
    return null
  }

  const normalized = asIsoDate(value)
  return normalized === new Date(0).toISOString() ? null : normalized
}

export function normalizePriceTableRecord(row: RawPriceTableRecord): PriceTableRecord {
  const resolvedScope =
    row.scope === "network"
      ? "global"
      : isPriceScope(row.scope)
        ? row.scope
        : "global"

  return {
    id: asText(row.id),
    name: asText(row.name),
    scope: resolvedScope,
    unitId: asNullableText(row.unit_id),
    unitName: asNullableText(row.unit_name),
    graceMinutes: asNumber(row.grace_minutes),
    toleranceMinutes: asNumber(row.tolerance_minutes),
    cycleHours: asNumber(row.cycle_hours),
    amount: asNumber(row.amount),
    startsAt: asIsoDate(row.starts_at),
    endsAt: asNullableIsoDate(row.ends_at),
    status: isPriceStatus(row.status) ? row.status : "inactive",
    notes: asNullableText(row.notes),
    createdAt: asNullableIsoDate(row.created_at),
    updatedAt: asNullableIsoDate(row.updated_at),
  }
}

export function normalizePriceTableRecords(rows: readonly RawPriceTableRecord[]) {
  return rows
    .map(normalizePriceTableRecord)
    .filter((record) => record.id.length > 0)
    .sort((first, second) => second.startsAt.localeCompare(first.startsAt))
}
