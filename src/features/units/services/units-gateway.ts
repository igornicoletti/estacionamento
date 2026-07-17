import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { isErpCatalogMockEnabled, mockErpUnitsPayload } from "@/features/erp-mock"
import { unitsCopy } from "../units-copy"
import { type ErpUnitPayload } from "../types/units-types"

export interface UnitsGateway {
  listUnitsPayload: () => Promise<readonly ErpUnitPayload[]>
}

function createSupabaseUnitsGateway(): UnitsGateway {
  return {
    async listUnitsPayload() {
      if (isErpCatalogMockEnabled()) {
        return mockErpUnitsPayload
      }

      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from("erp_units")
        .select([
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
        ].join(","))
        .order("cod_empresa", { ascending: true })

      if (error) {
        throw new Error(unitsCopy.errors.unitsLoad, { cause: error })
      }

      return normalizeErpRows(data, [
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
      ])
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function hasKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): value is Record<keyof ErpUnitPayload, unknown> {
  return keys.every((key) => key in value)
}

function normalizeErpRows(
  value: unknown,
  keys: readonly string[]
): readonly ErpUnitPayload[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (row): row is ErpUnitPayload => isRecord(row) && hasKeys(row, keys)
  )
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
