import { getSupabaseBrowserClient } from "@/lib"

import { pricesCopy } from "../prices-copy"
import {
  type PriceTable,
  type SavePriceTableInput,
} from "../types/prices-types"
import { parsePriceTable, parsePriceTables } from "../utils/prices-parsers"

const priceTableSelect = [
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
].join(",")

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(pricesCopy.feedback.loadError)
  }

  return supabase
}

function validatePriceInput(input: SavePriceTableInput) {
  if (input.scope === "unit") {
    if (!input.unitId?.trim()) {
      throw new Error(pricesCopy.form.validation.unitId)
    }

    if (!input.unitName?.trim()) {
      throw new Error(pricesCopy.form.validation.unitName)
    }
  }

  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error(pricesCopy.form.validation.amount)
  }

  if (!Number.isInteger(input.cycleHours) || input.cycleHours < 1 || input.cycleHours > 720) {
    throw new Error(pricesCopy.form.validation.cycleHours)
  }

  if (!Number.isInteger(input.graceMinutes) || input.graceMinutes < 0 || input.graceMinutes > 1440) {
    throw new Error(pricesCopy.form.validation.graceMinutes)
  }

  if (!Number.isInteger(input.toleranceMinutes) || input.toleranceMinutes < 0 || input.toleranceMinutes > 240) {
    throw new Error(pricesCopy.form.validation.toleranceMinutes)
  }

  if (!input.startsAt) {
    throw new Error(pricesCopy.form.validation.startsAt)
  }

  if (input.reason.trim().length < 10) {
    throw new Error(pricesCopy.form.validation.reason)
  }
}

function createPricePayload(input: SavePriceTableInput) {
  validatePriceInput(input)

  return {
    scope: input.scope,
    unit_id: input.scope === "unit" ? input.unitId?.trim() ?? null : null,
    unit_name: input.scope === "unit" ? input.unitName?.trim() ?? null : null,
    grace_minutes: input.graceMinutes,
    tolerance_minutes: input.toleranceMinutes,
    cycle_hours: input.cycleHours,
    amount: input.amount,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: input.status,
    version: 1,
    reason: input.reason.trim(),
    notes: input.notes?.trim() ? input.notes.trim() : null,
  }
}

async function getPriceTableById(id: string): Promise<PriceTable> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from("commercial_price_tables")
    .select(priceTableSelect)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(pricesCopy.feedback.save.error, { cause: error })
  }

  const price = parsePriceTable(data)

  if (!price) {
    throw new Error(pricesCopy.feedback.save.error)
  }

  return price
}

export async function listPriceTables(): Promise<PriceTable[]> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from("commercial_price_tables")
    .select(priceTableSelect)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(pricesCopy.feedback.loadError, { cause: error })
  }

  return parsePriceTables(data ?? [])
}

export async function savePriceTable(input: SavePriceTableInput): Promise<PriceTable> {
  const supabase = getSupabaseOrThrow()
  const payload = createPricePayload(input)
  const response = await supabase.rpc("create_commercial_price_table", {
    p_amount: payload.amount,
    p_cycle_hours: payload.cycle_hours,
    p_ends_at: payload.ends_at,
    p_grace_minutes: payload.grace_minutes,
    p_notes: payload.notes,
    p_reason: payload.reason,
    p_scope: payload.scope,
    p_starts_at: payload.starts_at,
    p_status: payload.status,
    p_tiers: [],
    p_tolerance_minutes: payload.tolerance_minutes,
    p_unit_id: payload.unit_id,
    p_unit_name: payload.unit_name,
  }) as { data: unknown; error: unknown }
  const { data, error } = response

  if (error || typeof data !== "string") {
    throw new Error(pricesCopy.feedback.save.error, { cause: error })
  }

  return getPriceTableById(data)
}
