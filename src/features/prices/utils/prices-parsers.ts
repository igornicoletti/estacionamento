import { pricesCopy } from "../prices-copy"
import { type PriceTable, type PriceTier } from "../types/prices-types"
import {
  getPriceComputedStatus,
  sanitizePriceTable,
  sortPriceTablesByUpdatedAt,
} from "./prices-models"

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
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function parseTier(value: unknown): PriceTier | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value.id)
  const sequence = readNumber(value.sequence)
  const limitHours = readNumber(value.limit_hours)
  const amount = readNumber(value.amount)

  if (!id || !sequence || !limitHours || amount === null) {
    return null
  }

  return {
    id,
    sequence: Math.trunc(sequence),
    limitHours: Math.trunc(limitHours),
    amount,
    notes: readNullableString(value.notes),
  }
}

function parseTierList(value: unknown) {
  if (!value) {
    return []
  }

  const rows = Array.isArray(value) ? value : [value]

  return rows
    .map(parseTier)
    .filter((tier): tier is PriceTier => Boolean(tier))
}

export function parsePriceTable(value: unknown): PriceTable | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value.id)
  const scope = value.scope === "network" || value.scope === "unit" ? value.scope : null
  const graceMinutes = readNumber(value.grace_minutes)
  const toleranceMinutes = readNumber(value.tolerance_minutes)
  const cycleHours = readNumber(value.cycle_hours)
  const amount = readNumber(value.amount)
  const startsAt = readString(value.starts_at)
  const status = value.status === "active" || value.status === "inactive" ? value.status : null
  const version = readNumber(value.version)
  const updatedAt = readString(value.updated_at)

  if (
    !id ||
    !scope ||
    graceMinutes === null ||
    toleranceMinutes === null ||
    cycleHours === null ||
    amount === null ||
    !startsAt ||
    !status ||
    !version ||
    !updatedAt
  ) {
    return null
  }

  return sanitizePriceTable({
    id,
    scope,
    unitId: readNullableString(value.unit_id),
    unitName: readNullableString(value.unit_name),
    graceMinutes: Math.trunc(graceMinutes),
    toleranceMinutes: Math.trunc(toleranceMinutes),
    cycleHours: Math.trunc(cycleHours),
    amount,
    startsAt,
    endsAt: readNullableString(value.ends_at),
    status,
    computedStatus: "inactive",
    version: Math.trunc(version),
    parentId: readNullableString(value.parent_id),
    reason: readNullableString(value.reason),
    notes: readNullableString(value.notes),
    updatedAt,
    tiers: parseTierList(value.commercial_price_tiers),
  })
}

export function parsePriceTables(value: unknown): PriceTable[] {
  if (!Array.isArray(value)) {
    throw new Error(pricesCopy.feedback.loadError)
  }

  return sortPriceTablesByUpdatedAt(
    value
      .map(parsePriceTable)
      .filter((price): price is PriceTable => Boolean(price))
      .map((price) => ({
        ...price,
        computedStatus: getPriceComputedStatus(price),
      }))
  )
}
