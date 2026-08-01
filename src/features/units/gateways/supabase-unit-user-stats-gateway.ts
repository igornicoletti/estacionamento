import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import {
  unitUserStatsRpcResponseSchema,
  unitUserStatsRowsSchema,
  type UnitUserStatsRow,
} from "../schemas/units-gateway-schemas"
import { type UnitUserStatsGateway } from "./units-gateway-contracts"

function parseRows(value: unknown): readonly UnitUserStatsRow[] {
  const result = unitUserStatsRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(unitsCopy.errors.unitUsersLoad, {
      cause: result.error,
    })
  }

  return result.data
}

export function createSupabaseUnitUserStatsGateway(): UnitUserStatsGateway {
  return {
    async listStats() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.errors.unitUsersLoad)
      }

      const response = unitUserStatsRpcResponseSchema.safeParse(
        await supabase.rpc("list_unit_user_stats")
      )

      if (!response.success) {
        throw new Error(unitsCopy.errors.unitUsersLoad, {
          cause: response.error,
        })
      }

      if (response.data.error) {
        throw new Error(unitsCopy.errors.unitUsersLoad, {
          cause: response.data.error,
        })
      }

      return parseRows(response.data.data)
    },
  }
}
