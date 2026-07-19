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

export async function listPriceTables(): Promise<PriceTablesResult> {
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
