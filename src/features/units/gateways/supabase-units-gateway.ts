import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { fetchAllPostgrestBatches } from "@/lib/supabase/fetch-all-postgrest-batches"

import { unitsCopy } from "../constants/units-copy"
import {
  UNITS_BATCH_SIZE,
  UNITS_MAX_BATCHES,
} from "../constants/units-persistence"
import {
  erpUnitRowsSchema,
  type ErpUnitRow,
} from "../schemas/units-gateway-schemas"
import { type UnitsGateway } from "./units-gateway-contracts"

const unitColumns = [
  "cod_empresa",
  "nom_razao_social",
  "nom_fantasia",
  "num_cnpj",
  "cod_bandeira",
  "des_bandeira",
  "cod_cidade",
  "nom_cidade",
  "nom_estado",
  "sgl_estado",
  "des_coordenada_empresa",
  "ip_rede",
  "nom_banco_dados",
].join(",")

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(unitsCopy.errors.unitsUnavailable)
  }

  return supabase
}

function parseUnitRows(value: unknown): readonly ErpUnitRow[] {
  const result = erpUnitRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(unitsCopy.errors.invalidUnitsResponse, {
      cause: result.error,
    })
  }

  return result.data
}

export function createSupabaseUnitsGateway(): UnitsGateway {
  return {
    async findUnitById(unitId) {
      const supabase = getSupabaseOrThrow()
      const { data, error } = await supabase
        .from("erp_units")
        .select(unitColumns)
        .eq("cod_empresa", unitId)
        .maybeSingle()

      if (error) {
        throw new Error(unitsCopy.errors.unitsLoad, { cause: error })
      }

      if (!data) {
        return null
      }

      return parseUnitRows([data])[0] ?? null
    },
    async listUnits() {
      const supabase = getSupabaseOrThrow()

      return fetchAllPostgrestBatches({
        batchSize: UNITS_BATCH_SIZE,
        maxBatches: UNITS_MAX_BATCHES,
        onLimitExceeded: () =>
          new Error(unitsCopy.errors.queryLimitExceeded),
        loadBatch: async (from, to) => {
          const { data, error } = await supabase
            .from("erp_units")
            .select(unitColumns)
            .order("cod_empresa", { ascending: true })
            .range(from, to)

          if (error) {
            throw new Error(unitsCopy.errors.unitsLoad, { cause: error })
          }

          return parseUnitRows(data)
        },
      })
    },
  }
}
