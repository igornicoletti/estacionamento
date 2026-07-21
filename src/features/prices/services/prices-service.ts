import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib"

import { PRICES_FETCH_LIMIT, pricesCopy } from "../constants"
import {
  normalizePriceTableRecords,
  type PriceStatus,
  type PriceTableRecord,
  type RawPriceTableRecord,
  type SavePriceTablePayload,
} from "../model"

const PRICE_TABLES_SELECT = [
  "id",
  "name",
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
  "notes",
  "created_at",
  "updated_at",
].join(",")

export interface PriceTablesResult {
  records: PriceTableRecord[]
  isTruncated: boolean
  limit: number
}

const MOCK_PRICES_STORAGE_KEY = "rmc.prices.mock-data"

function readMockPrices(): RawPriceTableRecord[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(MOCK_PRICES_STORAGE_KEY) ?? "[]") as RawPriceTableRecord[]
  } catch {
    return []
  }
}

function writeMockPrices(records: readonly RawPriceTableRecord[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(MOCK_PRICES_STORAGE_KEY, JSON.stringify(records))
  } catch { /* noop */ }
}

const mockSeedPrices: RawPriceTableRecord[] = [
  {
    id: "mock-price-1",
    name: "Tabela padrão",
    scope: "global",
    unit_id: null,
    unit_name: null,
    grace_minutes: 15,
    tolerance_minutes: 10,
    cycle_hours: 24,
    amount: 25.0,
    starts_at: "2026-07-01T00:00:00.000Z",
    ends_at: null,
    status: "active",
    notes: "Tabela de preços padrão para todas as unidades.",
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-07-10T14:00:00.000Z",
  },
  {
    id: "mock-price-2",
    name: "Tabela Monte Carlo Centro",
    scope: "unit",
    unit_id: "1",
    unit_name: "Monte Carlo Centro",
    grace_minutes: 20,
    tolerance_minutes: 15,
    cycle_hours: 12,
    amount: 18.5,
    starts_at: "2026-07-15T00:00:00.000Z",
    ends_at: "2026-12-31T23:59:59.000Z",
    status: "active",
    notes: null,
    created_at: "2026-07-10T08:00:00.000Z",
    updated_at: "2026-07-15T09:00:00.000Z",
  },
]

function getMockPrices(): RawPriceTableRecord[] {
  const stored = readMockPrices()
  return stored.length > 0 ? stored : mockSeedPrices
}

export async function listPriceTables(): Promise<PriceTablesResult> {
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    const rows = getMockPrices()
    return {
      records: normalizePriceTableRecords(rows),
      isTruncated: false,
      limit: rows.length,
    }
  }

  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(pricesCopy.feedback.loadError)
  }

  const { data, error } = await supabase
    .from("commercial_price_tables")
    .select(PRICE_TABLES_SELECT)
    .order("starts_at", { ascending: false })
    .limit(PRICES_FETCH_LIMIT + 1)

  if (error) {
    throw new Error(pricesCopy.feedback.loadError, { cause: error })
  }

  const rows = (data ?? []) as unknown as RawPriceTableRecord[]

  return {
    records: normalizePriceTableRecords(rows.slice(0, PRICES_FETCH_LIMIT)),
    isTruncated: rows.length > PRICES_FETCH_LIMIT,
    limit: PRICES_FETCH_LIMIT,
  }
}

export async function savePriceTable(payload: SavePriceTablePayload) {
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    const records = getMockPrices()
    const now = new Date().toISOString()
    records.unshift({
      id: `mock-price-${Date.now()}`,
      name: payload.name,
      scope: payload.scope,
      unit_id: payload.unitId,
      unit_name: payload.unitName,
      grace_minutes: payload.graceMinutes,
      tolerance_minutes: payload.toleranceMinutes,
      cycle_hours: payload.cycleHours,
      amount: payload.amount,
      starts_at: payload.startsAt,
      ends_at: payload.endsAt,
      status: payload.status,
      notes: payload.notes,
      created_at: now,
      updated_at: now,
    })
    writeMockPrices(records)
    return
  }

  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(pricesCopy.feedback.saveError)
  }

  const { error } = await supabase.rpc("create_commercial_price_table", {
    p_scope: payload.scope,
    p_unit_id: payload.unitId,
    p_unit_name: payload.unitName,
    p_grace_minutes: payload.graceMinutes,
    p_tolerance_minutes: payload.toleranceMinutes,
    p_cycle_hours: payload.cycleHours,
    p_amount: payload.amount,
    p_starts_at: payload.startsAt,
    p_ends_at: payload.endsAt,
    p_status: payload.status,
    p_notes: payload.notes,
    p_tiers: [],
  })

  if (error) {
    throw new Error(pricesCopy.feedback.saveError, { cause: error })
  }
}

export async function updatePriceTableStatus(id: string, status: PriceStatus) {
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()
    const records = getMockPrices()
    const index = records.findIndex((r) => r.id === id)
    if (index >= 0) {
      records[index] = { ...records[index], status, updated_at: new Date().toISOString() }
      writeMockPrices(records)
    }
    return
  }

  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(pricesCopy.feedback.saveError)
  }

  const { error } = await supabase
    .from("commercial_price_tables")
    .update({ status })
    .eq("id", id)

  if (error) {
    throw new Error(pricesCopy.feedback.saveError, { cause: error })
  }
}
