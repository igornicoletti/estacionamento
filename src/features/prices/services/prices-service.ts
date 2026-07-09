import { getSupabaseBrowserClient } from "@/lib"

import { type PriceTable, type PriceTableScope, type PriceTier } from "../types/prices-types"
import {
  sanitizePriceTable,
  sortPriceTablesByUpdatedAt,
} from "../utils/prices-models"

const STORAGE_KEY = "rmc.price-tables.v1"

interface RawPriceTierRow {
  id: string
  sequence: number
  limit_hours: number
  amount: number | string
  notes: string | null
}

interface RawPriceTableRow {
  id: string
  scope: PriceTableScope
  unit_id: string | null
  unit_name: string | null
  grace_minutes: number
  tolerance_minutes: number
  cycle_hours: number
  amount: number | string
  starts_at: string
  ends_at: string | null
  status: "active" | "inactive"
  version: number
  parent_id: string | null
  reason: string | null
  notes: string | null
  updated_at: string
  commercial_price_tiers?: RawPriceTierRow[] | RawPriceTierRow | null
}

export interface PricesGateway {
  listPriceTables(): Promise<PriceTable[]>
}

let configuredGateway: PricesGateway | null = null

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function normalizeTierRow(row: RawPriceTierRow): PriceTier {
  return {
    id: row.id,
    sequence: row.sequence,
    limitHours: row.limit_hours,
    amount: Number(row.amount),
    notes: row.notes,
  }
}

function getTierRows(row: RawPriceTableRow) {
  if (!row.commercial_price_tiers) {
    return [] as RawPriceTierRow[]
  }

  return Array.isArray(row.commercial_price_tiers)
    ? row.commercial_price_tiers
    : [row.commercial_price_tiers]
}

function normalizePriceTableRow(row: RawPriceTableRow) {
  return sanitizePriceTable({
    id: row.id,
    scope: row.scope,
    unitId: row.unit_id,
    unitName: row.unit_name,
    graceMinutes: row.grace_minutes,
    toleranceMinutes: row.tolerance_minutes,
    cycleHours: row.cycle_hours,
    amount: Number(row.amount),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    version: row.version,
    parentId: row.parent_id,
    reason: row.reason,
    notes: row.notes,
    updatedAt: row.updated_at,
    tiers: getTierRows(row).map(normalizeTierRow),
  })
}

function shouldUseSupabasePricesGateway() {
  return import.meta.env.MODE !== "test" && Boolean(getSupabaseBrowserClient())
}

function createEmptyPricesGateway(): PricesGateway {
  return {
    async listPriceTables() {
      await Promise.resolve()
      return []
    },
  }
}

function createLocalStoragePricesGateway(): PricesGateway {
  return {
    async listPriceTables() {
      await Promise.resolve()

      if (!canUseStorage()) {
        return []
      }

      const raw = window.localStorage.getItem(STORAGE_KEY)

      if (!raw) {
        return []
      }

      try {
        const parsed: unknown = JSON.parse(raw)

        if (!Array.isArray(parsed)) {
          return []
        }

        return sortPriceTablesByUpdatedAt(
          parsed
            .map(sanitizePriceTable)
            .filter((price): price is PriceTable => Boolean(price))
        )
      } catch {
        return []
      }
    },
  }
}

function createSupabasePricesGateway(): PricesGateway {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return createEmptyPricesGateway()
  }

  return {
    async listPriceTables() {
      const { data, error } = await supabase
        .from("commercial_price_tables")
        .select([
          "id",
          "scope",
          "unit_id",
          "unit_name",
          "grace_minutes",
          "tolerance_minutes",
          "cycle_hours",
          "amount",
          "starts_at",
          "ends_at",
          "status",
          "version",
          "parent_id",
          "reason",
          "notes",
          "updated_at",
          "commercial_price_tiers(id,sequence,limit_hours,amount,notes)",
        ].join(","))
        .order("updated_at", { ascending: false })

      if (error) {
        throw new Error("Não foi possível carregar as tabelas de preço.", {
          cause: error,
        })
      }

      return sortPriceTablesByUpdatedAt(
        ((data ?? []) as unknown as RawPriceTableRow[])
          .map(normalizePriceTableRow)
          .filter((price): price is PriceTable => Boolean(price))
      )
    },
  }
}

function getPricesGateway() {
  if (configuredGateway) {
    return configuredGateway
  }

  if (shouldUseSupabasePricesGateway()) {
    return createSupabasePricesGateway()
  }

  return createLocalStoragePricesGateway()
}

export function setPricesGateway(gateway: PricesGateway) {
  configuredGateway = gateway
}

export function resetPricesGateway() {
  configuredGateway = null
}

export function createMemoryPricesGateway(seedPrices: readonly PriceTable[] = []): PricesGateway {
  const prices = sortPriceTablesByUpdatedAt(
    seedPrices
      .map(sanitizePriceTable)
      .filter((price): price is PriceTable => Boolean(price))
  )

  return {
    async listPriceTables() {
      await Promise.resolve()
      return prices.map((price) => ({
        ...price,
        tiers: price.tiers.map((tier) => ({ ...tier })),
      }))
    },
  }
}

export function listPriceTables(): Promise<PriceTable[]> {
  return getPricesGateway().listPriceTables()
}
