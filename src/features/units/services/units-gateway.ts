import { isErpCatalogMockEnabled, mockErpUnitsPayload } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants"
import { type ErpUnitPayload } from "../model"

export interface UnitsGateway {
  listUnitsPayload: () => Promise<readonly ErpUnitPayload[]>
}

const unitPayloadKeys = [
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
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function hasKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return keys.every((key) => key in value)
}

function normalizeErpRows(value: unknown): readonly ErpUnitPayload[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (row): row is ErpUnitPayload => isRecord(row) && hasKeys(row, unitPayloadKeys)
  )
}

function createSupabaseUnitsGateway(): UnitsGateway {
  return {
    async listUnitsPayload() {
      if (isErpCatalogMockEnabled()) {
        return mockErpUnitsPayload
      }

      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.errors.unitsUnavailable)
      }

      const response = await supabase
        .from("erp_units")
        .select(unitPayloadKeys.join(","))
        .order("cod_empresa", { ascending: true }) as unknown as { data: unknown; error: unknown }
      const { data, error } = response

      if (error) {
        throw new Error(unitsCopy.errors.unitsLoad, { cause: error })
      }

      return normalizeErpRows(data)
    },
  }
}

let unitsGateway: UnitsGateway = createSupabaseUnitsGateway()

export function getUnitsGateway() {
  return unitsGateway
}

export function configureUnitsGateway(gateway: UnitsGateway) {
  unitsGateway = gateway
}

export function resetUnitsGateway() {
  unitsGateway = createSupabaseUnitsGateway()
}
