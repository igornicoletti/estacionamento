import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import { type UnitUserStats } from "../model"

const relatedAppUserSchema = z.object({ role: z.string().nullable(), status: z.string().nullable() })
const rawUnitUserStatsRowSchema = z.object({
  unit_id: z.union([z.string(), z.number()]).nullable(),
  app_users: z.union([relatedAppUserSchema, z.array(relatedAppUserSchema), z.null()]).optional(),
})
const rawUnitUserStatsRowsSchema = z.array(rawUnitUserStatsRowSchema)
const supabaseResponseSchema = z.object({ data: z.unknown().nullable(), error: z.unknown().nullable() }).passthrough()
type RawUnitUserStatsRow = z.infer<typeof rawUnitUserStatsRowSchema>
type RelatedAppUser = z.infer<typeof relatedAppUserSchema>

function normalizeUnitId(value: string | number | null) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null
  }
  const normalizedValue = value?.trim() ?? ""
  return normalizedValue || null
}

function resolveRelatedAppUser(value: RawUnitUserStatsRow["app_users"]): RelatedAppUser | null {
  if (!value) {
    return null
  }
  return Array.isArray(value) ? value[0] ?? null : value
}

function parseSupabaseResponse(value: unknown) {
  const result = supabaseResponseSchema.safeParse(value)
  if (!result.success) {
    throw new Error(unitsCopy.errors.unitUsersLoad, { cause: result.error })
  }
  if (result.data.error) {
    throw new Error(unitsCopy.errors.unitUsersLoad, { cause: result.data.error })
  }
  return result.data.data
}

function parseUnitUserStatsRows(value: unknown) {
  const result = rawUnitUserStatsRowsSchema.safeParse(value ?? [])
  if (!result.success) {
    throw new Error(unitsCopy.errors.unitUsersLoad, { cause: result.error })
  }
  return result.data
}

function buildUnitUserStatsFromRows(rows: readonly RawUnitUserStatsRow[]) {
  const stats = new Map<string, UnitUserStats>()
  for (const row of rows) {
    const unitId = normalizeUnitId(row.unit_id)
    const user = resolveRelatedAppUser(row.app_users)
    if (!unitId || !user || user.status !== "active") {
      continue
    }
    const current = stats.get(unitId) ?? { managers: 0, operators: 0 }
    if (user.role === "manager") {
      current.managers += 1
    }
    if (user.role === "operator") {
      current.operators += 1
    }
    stats.set(unitId, current)
  }
  return stats
}

export async function listUnitUserStats(): Promise<Map<string, UnitUserStats>> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(unitsCopy.errors.unitUsersLoad)
  }
  const response: unknown = await supabase
    .from("app_user_units")
    .select("unit_id, app_users!inner(role, status)")
    .eq("app_users.status", "active")
  return buildUnitUserStatsFromRows(parseUnitUserStatsRows(parseSupabaseResponse(response)))
}
