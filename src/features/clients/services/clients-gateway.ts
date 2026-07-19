import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  CLIENTS_BATCH_SIZE,
  CLIENTS_MAX_BATCHES,
  clientsCopy,
} from "../constants"
import {
  clientPayloadKeys,
  clientVehiclePayloadKeys,
  parseRows,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "../model"

export interface ClientsGateway {
  listClientVehiclesPayload: () => Promise<readonly ErpClientVehiclePayload[]>
  listClientsPayload: () => Promise<readonly ErpClientPayload[]>
}

async function fetchAllBatches<TRow>(
  loader: (from: number, to: number) => Promise<readonly TRow[]>
) {
  const rows: TRow[] = []

  for (let batch = 0; batch < CLIENTS_MAX_BATCHES; batch += 1) {
    const from = batch * CLIENTS_BATCH_SIZE
    const to = from + CLIENTS_BATCH_SIZE - 1
    const chunk = await loader(from, to)

    rows.push(...chunk)

    if (chunk.length < CLIENTS_BATCH_SIZE) {
      return rows
    }
  }

  throw new Error(clientsCopy.errors.syncLimitExceeded)
}

function getSupabaseOrThrow(errorMessage: string) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(errorMessage)
  }

  return supabase
}

function createSupabaseClientsGateway(): ClientsGateway {
  return {
    async listClientsPayload() {
      const supabase = getSupabaseOrThrow(clientsCopy.errors.clientsLoad)

      return fetchAllBatches<ErpClientPayload>(async (from, to) => {
        const { data, error } = await supabase
          .from("erp_clients")
          .select([
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
          ].join(","))
          .eq("is_active_120d", true)
          .order("cod_pessoa", { ascending: true })
          .range(from, to)

        if (error) {
          throw new Error(clientsCopy.errors.clientsLoad, { cause: error })
        }

        return parseRows<ErpClientPayload>(
          data,
          clientPayloadKeys,
          clientsCopy.errors.invalidClientsResponse
        )
      })
    },
    async listClientVehiclesPayload() {
      const supabase = getSupabaseOrThrow(clientsCopy.errors.vehiclesLoad)

      return fetchAllBatches<ErpClientVehiclePayload>(async (from, to) => {
        const { data, error } = await supabase
          .from("erp_client_vehicles")
          .select([
            "cod_veiculo",
            "cod_pessoa",
            "nom_pessoa",
            "nom_fantasia",
            "num_cnpj_cpf",
            "num_placa",
            "des_veiculo",
            "nom_motorista",
          ].join(","))
          .eq("client_is_active_120d", true)
          .order("cod_veiculo", { ascending: true })
          .range(from, to)

        if (error) {
          throw new Error(clientsCopy.errors.vehiclesLoad, { cause: error })
        }

        return parseRows<ErpClientVehiclePayload>(
          data,
          clientVehiclePayloadKeys,
          clientsCopy.errors.invalidClientsResponse
        )
      })
    },
  }
}

let clientsGateway: ClientsGateway = createSupabaseClientsGateway()

export function configureClientsGateway(gateway: ClientsGateway) {
  clientsGateway = gateway
}

export function getClientsGateway() {
  return clientsGateway
}

export function resetClientsGateway() {
  clientsGateway = createSupabaseClientsGateway()
}
