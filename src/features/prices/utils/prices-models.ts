import { formatDate, formatDateTime } from "@/lib"

import {
  type PriceComputedStatus,
  type PriceRecordStatus,
  type PriceTable,
  type PriceTableScope,
  type PriceTier,
} from "../types/prices-types"

const statusValues = new Set<PriceRecordStatus>(["active", "inactive"])
const scopeValues = new Set<PriceTableScope>(["network", "unit"])

function normalizeText(value: unknown) {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ")
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return ""
}

function normalizeOptionalText(value: unknown) {
  const text = normalizeText(value)

  return text ? text : null
}

function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim())

    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function normalizeInteger(value: unknown, fallback = 0) {
  return Math.trunc(normalizeNumber(value, fallback))
}

function normalizeIsoDate(value: unknown) {
  const text = normalizeText(value)

  if (!text) {
    return ""
  }

  const date = new Date(text)

  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

function normalizeIsoDateOrNull(value: unknown) {
  const isoDate = normalizeIsoDate(value)

  return isoDate || null
}

function sanitizePriceTier(value: unknown): PriceTier | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<PriceTier>
  const id = normalizeText(candidate.id)
  const sequence = normalizeInteger(candidate.sequence)
  const limitHours = normalizeInteger(candidate.limitHours)
  const amount = normalizeNumber(candidate.amount)

  if (!id || sequence <= 0 || limitHours <= 0 || amount < 0) {
    return null
  }

  return {
    id,
    sequence,
    limitHours,
    amount,
    notes: normalizeOptionalText(candidate.notes),
  }
}

export function sanitizePriceTable(value: unknown): PriceTable | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<PriceTable>
  const id = normalizeText(candidate.id)
  const scope = scopeValues.has(candidate.scope as PriceTableScope)
    ? candidate.scope as PriceTableScope
    : null
  const startsAt = normalizeIsoDate(candidate.startsAt)
  const updatedAt = normalizeIsoDate(candidate.updatedAt) || startsAt
  const status = statusValues.has(candidate.status as PriceRecordStatus)
    ? candidate.status as PriceRecordStatus
    : "active"
  const graceMinutes = normalizeInteger(candidate.graceMinutes)
  const toleranceMinutes = normalizeInteger(candidate.toleranceMinutes)
  const cycleHours = normalizeInteger(candidate.cycleHours)
  const amount = normalizeNumber(candidate.amount)
  const tiers = Array.isArray(candidate.tiers)
    ? candidate.tiers
      .map(sanitizePriceTier)
      .filter((tier): tier is PriceTier => Boolean(tier))
      .sort((first, second) => first.sequence - second.sequence)
    : []

  if (
    !id ||
    !scope ||
    !startsAt ||
    graceMinutes < 0 ||
    toleranceMinutes < 0 ||
    cycleHours <= 0 ||
    amount < 0
  ) {
    return null
  }

  const unitId = normalizeOptionalText(candidate.unitId)

  if (scope === "unit" && !unitId) {
    return null
  }

  const endsAt = normalizeIsoDateOrNull(candidate.endsAt)

  return {
    id,
    scope,
    unitId: scope === "unit" ? unitId : null,
    unitName: normalizeOptionalText(candidate.unitName),
    graceMinutes,
    toleranceMinutes,
    cycleHours,
    amount,
    startsAt,
    endsAt,
    status,
    computedStatus: getPriceComputedStatus({ status, startsAt, endsAt }),
    version: Math.max(1, normalizeInteger(candidate.version, 1)),
    parentId: normalizeOptionalText(candidate.parentId),
    reason: normalizeOptionalText(candidate.reason),
    notes: normalizeOptionalText(candidate.notes),
    updatedAt,
    tiers,
  }
}

export function sortPriceTablesByUpdatedAt(prices: readonly PriceTable[]) {
  return [...prices].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt)
  )
}

export function getPriceComputedStatus(
  price: Pick<PriceTable, "status" | "startsAt" | "endsAt">,
  now = new Date()
): PriceComputedStatus {
  if (price.status === "inactive") {
    return "inactive"
  }

  const startsAt = new Date(price.startsAt)
  const endsAt = price.endsAt ? new Date(price.endsAt) : null

  if (!Number.isNaN(startsAt.getTime()) && startsAt > now) {
    return "scheduled"
  }

  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt < now) {
    return "expired"
  }

  return "active"
}

export function formatPriceMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    currency: "BRL",
    style: "currency",
  })
}

export function formatPriceMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

export function formatPriceHours(hours: number) {
  return `${hours}h`
}

export function getPriceScopeLabel(price: Pick<PriceTable, "scope">) {
  return price.scope === "network" ? "Padrão da rede" : "Por unidade"
}

export function getPriceUnitLabel(price: Pick<PriceTable, "scope" | "unitName" | "unitId">) {
  if (price.scope === "network") {
    return "Todas as unidades"
  }

  return price.unitName ?? price.unitId ?? "Unidade não identificada"
}

export function getPriceStatusLabel(status: PriceComputedStatus) {
  const labels: Record<PriceComputedStatus, string> = {
    active: "Vigente",
    expired: "Encerrada",
    inactive: "Inativa",
    scheduled: "Futura",
  }

  return labels[status]
}

export function formatPriceCharge(price: Pick<PriceTable, "amount" | "cycleHours" | "tiers">) {
  if (price.tiers.length === 0) {
    return `${formatPriceMoney(price.amount)} / ${formatPriceHours(price.cycleHours)}`
  }

  return price.tiers
    .map((tier) => `Até ${formatPriceHours(tier.limitHours)} · ${formatPriceMoney(tier.amount)}`)
    .join(" | ")
}

export function formatPriceDate(value: string | null | undefined) {
  return formatDate(value)
}

export function formatPriceDateTime(value: string | null | undefined) {
  return formatDateTime(value)
}
