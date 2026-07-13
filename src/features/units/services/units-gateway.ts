import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { type ErpUnitPayload } from "../types/units-types"

export interface UnitsGateway {
  listUnitsPayload: () => Promise<readonly ErpUnitPayload[]>
}

function createSupabaseUnitsGateway(): UnitsGateway {
  return {
    async listUnitsPayload() {
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
        throw new Error(error.message)
      }

      return (data ?? []) as readonly ErpUnitPayload[]
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
