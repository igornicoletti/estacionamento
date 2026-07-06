import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "../types/clients-types"

export interface ClientsGateway {
  listClientsPayload: () => Promise<readonly ErpClientPayload[]>
  listClientVehiclesPayload: () => Promise<readonly ErpClientVehiclePayload[]>
}

const DEFAULT_BATCH_SIZE = 500
const MAX_BATCHES = 20

async function fetchAllBatches<TRow>(
  loader: (from: number, to: number) => Promise<TRow[]>
) {
  const rows: TRow[] = []

  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const from = batch * DEFAULT_BATCH_SIZE
    const to = from + DEFAULT_BATCH_SIZE - 1
    const chunk = await loader(from, to)

    rows.push(...chunk)

    if (chunk.length < DEFAULT_BATCH_SIZE) {
      return rows
    }
  }

  throw new Error("A busca de clientes excedeu o limite seguro de paginas.")
}

function createSupabaseClientsGateway(): ClientsGateway {
  return {
    async listClientsPayload() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        return []
      }

      const data = await fetchAllBatches<ErpClientPayload>(async (from, to) => {
        const { data, error } = await supabase
          .from("erp_clients")
          .select(
            [
              "cod_pessoa",
              "nom_pessoa",
              "nom_fantasia",
              "num_cnpj_cpf",
              "des_email_1",
              "num_telefone_1",
              "nom_cidade",
              "sgl_estado",
              "dta_cadastro",
              "ind_pessoa_ativa",
              "bloqueio_financeiro",
              "qtd_veiculos",
              "dta_ultima_compra",
              "is_active_120d",
            ].join(",")
          )
          .eq("is_active_120d", true)
          .order("cod_pessoa", { ascending: true })
          .range(from, to)

        if (error) {
          throw new Error(error.message)
        }

        return (data ?? []) as unknown as ErpClientPayload[]
      })

      return data
    },
    async listClientVehiclesPayload() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        return []
      }

      const data = await fetchAllBatches<ErpClientVehiclePayload>(async (from, to) => {
        const { data, error } = await supabase
          .from("erp_client_vehicles")
          .select(
            [
              "cod_veiculo",
              "cod_pessoa",
              "nom_pessoa",
              "nom_fantasia",
              "num_cnpj_cpf",
              "num_placa",
              "des_veiculo",
              "nom_motorista",
            ].join(",")
          )
          .eq("client_is_active_120d", true)
          .order("cod_veiculo", { ascending: true })
          .range(from, to)

        if (error) {
          throw new Error(error.message)
        }

        return (data ?? []) as unknown as ErpClientVehiclePayload[]
      })

      return data
    },
  }
}

let clientsGateway: ClientsGateway = createSupabaseClientsGateway()

export function getClientsGateway() {
  return clientsGateway
}

export function configureClientsGateway(gateway: ClientsGateway) {
  clientsGateway = gateway
}

export function resetClientsGateway() {
  clientsGateway = createSupabaseClientsGateway()
}
