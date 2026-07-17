import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { pricesCopy } from "../prices-copy"
import {
  type PriceComputedStatus,
  type PriceTable,
  type PriceTableScope,
} from "../types/prices-types"

export function formatPriceMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value)
}

export function formatPriceMinutes(value: number) {
  return `${value} min`
}

export function formatPriceHours(value: number) {
  return value === 1 ? "1 hora" : `${value} horas`
}

export function formatPriceDate(value: string | null) {
  if (!value) {
    return pricesCopy.labels.noEndDate
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatPriceDateTime(value: string) {
  return formatPriceDate(value)
}

export function getPriceComputedStatus(price: Pick<PriceTable, "startsAt" | "endsAt" | "status">): PriceComputedStatus {
  if (price.status === "inactive") {
    return "inactive"
  }

  const now = Date.now()
  const startsAt = new Date(price.startsAt).getTime()
  const endsAt = price.endsAt ? new Date(price.endsAt).getTime() : null

  if (Number.isFinite(startsAt) && startsAt > now) {
    return "scheduled"
  }

  if (endsAt && Number.isFinite(endsAt) && endsAt < now) {
    return "expired"
  }

  return "active"
}

export function getPriceStatusLabel(status: PriceComputedStatus) {
  const labels: Record<PriceComputedStatus, string> = {
    active: pricesCopy.labels.active,
    expired: pricesCopy.labels.expired,
    inactive: pricesCopy.labels.inactive,
    scheduled: pricesCopy.labels.scheduled,
  }

  return labels[status]
}

export function getPriceScopeLabel(price: Pick<PriceTable, "scope"> | PriceTableScope) {
  const scope = typeof price === "string" ? price : price.scope
  return scope === "network" ? pricesCopy.labels.network : pricesCopy.labels.unit
}

export function getPriceUnitLabel(price: Pick<PriceTable, "scope" | "unitName" | "unitId">) {
  if (price.scope === "network") {
    return pricesCopy.labels.allUnits
  }

  return price.unitName ?? price.unitId ?? pricesCopy.labels.emptyValue
}

export function formatPriceCharge(price: Pick<PriceTable, "amount" | "cycleHours">) {
  return `${formatPriceMoney(price.amount)} / ${formatPriceHours(price.cycleHours)}`
}

export function sortPriceTablesByUpdatedAt(prices: readonly PriceTable[]) {
  return [...prices].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
}

export function sanitizePriceTable(value: PriceTable | null): PriceTable | null {
  if (!value) {
    return null
  }

  return {
    ...value,
    computedStatus: getPriceComputedStatus(value),
    tiers: value.tiers.map((tier) => ({ ...tier })),
  }
}

export function buildPriceDetails(price: PriceTable): readonly AppDetailsSheetItem[] {
  const tiers = price.tiers.length > 0
    ? price.tiers
      .map((tier) => `Até ${formatPriceHours(tier.limitHours)}: ${formatPriceMoney(tier.amount)}`)
      .join(" | ")
    : pricesCopy.labels.noTiers

  return [
    { label: pricesCopy.table.scope, value: getPriceScopeLabel(price) },
    { label: pricesCopy.table.unit, value: getPriceUnitLabel(price) },
    { label: pricesCopy.table.charge, value: formatPriceCharge(price) },
    { label: pricesCopy.table.cycle, value: formatPriceHours(price.cycleHours) },
    { label: pricesCopy.table.grace, value: formatPriceMinutes(price.graceMinutes) },
    { label: pricesCopy.table.tolerance, value: formatPriceMinutes(price.toleranceMinutes) },
    { label: pricesCopy.table.startsAt, value: formatPriceDate(price.startsAt) },
    { label: pricesCopy.table.endsAt, value: formatPriceDate(price.endsAt) },
    { label: pricesCopy.table.status, value: getPriceStatusLabel(price.computedStatus) },
    { label: pricesCopy.table.version, value: String(price.version) },
    { label: pricesCopy.table.tiers, value: tiers },
    { label: pricesCopy.table.notes, value: price.notes ?? pricesCopy.labels.emptyValue },
    { label: pricesCopy.table.updatedAt, value: formatPriceDateTime(price.updatedAt) },
  ]
}

export function toDateTimeLocalValue(value: Date) {
  const offsetMs = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16)
}
