import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { fetchAllPostgrestBatches } from "@/lib/supabase/fetch-all-postgrest-batches"

import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENTS_BATCH_SIZE,
  CLIENTS_MAX_BATCHES,
} from "../constants/clients-persistence"
import {
  erpClientRowsSchema,
  erpClientVehicleRowsSchema,
  type ErpClientRow,
  type ErpClientVehicleRow,
} from "../schemas/clients-gateway-schemas"
import { type ClientsGateway } from "./clients-gateway-contracts"

const clientColumns = [
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

const vehicleColumns = [
  "cod_veiculo",
  "cod_pessoa",
  "nom_pessoa",
  "nom_fantasia",
  "num_cnpj_cpf",
  "num_placa",
  "des_veiculo",
  "nom_motorista",
].join(",")

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(clientsCopy.errors.clientsUnavailable)
  }

  return supabase
}

function parseClientRows(value: unknown): readonly ErpClientRow[] {
  const result = erpClientRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(clientsCopy.errors.invalidClientsResponse, {
      cause: result.error,
    })
  }

  return result.data
}

function parseVehicleRows(
  value: unknown
): readonly ErpClientVehicleRow[] {
  const result = erpClientVehicleRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(clientsCopy.errors.invalidVehiclesResponse, {
      cause: result.error,
    })
  }

  return result.data
}

export function createSupabaseClientsGateway(): ClientsGateway {
  return {
    async findClientById(clientId) {
      const supabase = getSupabaseOrThrow()
      const { data, error } = await supabase
        .from("erp_clients")
        .select(clientColumns)
        .eq("cod_pessoa", clientId)
        .eq("is_active_120d", true)
        .maybeSingle()

      if (error) {
        throw new Error(clientsCopy.errors.clientsLoad, { cause: error })
      }

      if (!data) {
        return null
      }

      return parseClientRows([data])[0] ?? null
    },
    async listClients() {
      const supabase = getSupabaseOrThrow()

      return fetchAllPostgrestBatches({
        batchSize: CLIENTS_BATCH_SIZE,
        maxBatches: CLIENTS_MAX_BATCHES,
        onLimitExceeded: () =>
          new Error(clientsCopy.errors.queryLimitExceeded),
        loadBatch: async (from, to) => {
          const { data, error } = await supabase
            .from("erp_clients")
            .select(clientColumns)
            .eq("is_active_120d", true)
            .order("cod_pessoa", { ascending: true })
            .range(from, to)

          if (error) {
            throw new Error(clientsCopy.errors.clientsLoad, {
              cause: error,
            })
          }

          return parseClientRows(data)
        },
      })
    },
    async listVehiclesByClientId(clientId) {
      const supabase = getSupabaseOrThrow()

      return fetchAllPostgrestBatches({
        batchSize: CLIENTS_BATCH_SIZE,
        maxBatches: CLIENTS_MAX_BATCHES,
        onLimitExceeded: () =>
          new Error(clientsCopy.errors.queryLimitExceeded),
        loadBatch: async (from, to) => {
          const { data, error } = await supabase
            .from("erp_client_vehicles")
            .select(vehicleColumns)
            .eq("cod_pessoa", clientId)
            .eq("client_is_active_120d", true)
            .order("num_placa", { ascending: true })
            .order("cod_veiculo", { ascending: true })
            .range(from, to)

          if (error) {
            throw new Error(clientsCopy.errors.vehiclesLoad, {
              cause: error,
            })
          }

          return parseVehicleRows(data)
        },
      })
    },
  }
}
