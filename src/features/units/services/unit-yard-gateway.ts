import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import { normalizeUnitYardConfig } from "../model/units-normalization"
import {
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "../model/units-types"

export interface UnitYardGateway {
  listConfigs: () => Promise<readonly UnitYardConfig[]>
  upsertConfig: (input: UpsertUnitYardConfigInput) => Promise<UnitYardConfig>
}

const rawUnitYardConfigRowSchema = z.object({
  unit_id: z.string().trim().min(1),
  patio_active: z.boolean(),
  parking_spots: z.number(),
  updated_at: z.string().trim().min(1),
})
const supabaseResponseSchema = z
  .object({ data: z.unknown().nullable(), error: z.unknown().nullable() })
  .passthrough()
const rawUnitYardConfigRowsSchema = z.array(rawUnitYardConfigRowSchema)
type RawUnitYardConfigRow = z.infer<typeof rawUnitYardConfigRowSchema>

function mapUnitYardConfig(row: RawUnitYardConfigRow): UnitYardConfig {
  return normalizeUnitYardConfig({
    unitId: row.unit_id,
    patioActive: row.patio_active,
    parkingSpots: row.parking_spots,
    updatedAt: row.updated_at,
  })
}

function parseSupabaseResponse(value: unknown, errorMessage: string) {
  const result = supabaseResponseSchema.safeParse(value)
  if (!result.success) {
    throw new Error(errorMessage, { cause: result.error })
  }
  if (result.data.error) {
    throw new Error(errorMessage, { cause: result.data.error })
  }
  return result.data.data
}

function parseRawUnitYardConfigRows(value: unknown) {
  const result = rawUnitYardConfigRowsSchema.safeParse(value ?? [])
  if (!result.success) {
    throw new Error(unitsCopy.errors.unitYardLoad, { cause: result.error })
  }
  return result.data.map(mapUnitYardConfig)
}

function parseRawUnitYardConfigRow(value: unknown) {
  const result = rawUnitYardConfigRowSchema.safeParse(value)
  if (!result.success) {
    throw new Error(unitsCopy.errors.unitYardSave, { cause: result.error })
  }
  return mapUnitYardConfig(result.data)
}

function createSupabaseUnitYardGateway(): UnitYardGateway {
  return {
    async listConfigs() {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error(unitsCopy.errors.unitYardLoad)
      }
      const response: unknown = await supabase
        .from("unit_yard_configs")
        .select("unit_id, patio_active, parking_spots, updated_at")
        .order("unit_id", { ascending: true })
      const data = parseSupabaseResponse(
        response,
        unitsCopy.errors.unitYardLoad,
      )
      return parseRawUnitYardConfigRows(data)
    },
    async upsertConfig(input) {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error(unitsCopy.errors.unitYardSave)
      }
      const response: unknown = await supabase
        .from("unit_yard_configs")
        .upsert(
          {
            unit_id: input.unitId,
            patio_active: input.patioActive,
            parking_spots: input.parkingSpots,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "unit_id" },
        )
        .select("unit_id, patio_active, parking_spots, updated_at")
        .single()
      const data = parseSupabaseResponse(
        response,
        unitsCopy.errors.unitYardSave,
      )
      return parseRawUnitYardConfigRow(data)
    },
  }
}

let unitYardGateway: UnitYardGateway = createSupabaseUnitYardGateway()

export function getUnitYardGateway() {
  return unitYardGateway
}

export function configureUnitYardGateway(gateway: UnitYardGateway) {
  unitYardGateway = gateway
}

export function resetUnitYardGateway() {
  unitYardGateway = createSupabaseUnitYardGateway()
}
