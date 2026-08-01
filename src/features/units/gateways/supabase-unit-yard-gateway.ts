import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import {
  unitYardConfigRowsSchema,
  type UnitYardConfigRow,
} from "../schemas/units-gateway-schemas"
import { type UnitYardGateway } from "./units-gateway-contracts"

const yardConfigColumns =
  "unit_id,patio_active,parking_spots,updated_at"

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(unitsCopy.errors.unitYardLoad)
  }

  return supabase
}

function parseRows(value: unknown): readonly UnitYardConfigRow[] {
  const result = unitYardConfigRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(unitsCopy.errors.invalidUnitYardResponse, {
      cause: result.error,
    })
  }

  return result.data
}

export function createSupabaseUnitYardGateway(): UnitYardGateway {
  return {
    async findConfigByUnitId(unitId) {
      const supabase = getSupabaseOrThrow()
      const { data, error } = await supabase
        .from("unit_yard_configs")
        .select(yardConfigColumns)
        .eq("unit_id", unitId)
        .maybeSingle()

      if (error) {
        throw new Error(unitsCopy.errors.unitYardLoad, { cause: error })
      }

      if (!data) {
        return null
      }

      return parseRows([data])[0] ?? null
    },
    async listConfigs() {
      const supabase = getSupabaseOrThrow()
      const { data, error } = await supabase
        .from("unit_yard_configs")
        .select(yardConfigColumns)
        .order("unit_id", { ascending: true })

      if (error) {
        throw new Error(unitsCopy.errors.unitYardLoad, { cause: error })
      }

      return parseRows(data)
    },
  }
}
