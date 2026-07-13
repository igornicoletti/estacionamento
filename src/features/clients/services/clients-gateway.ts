import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { type ErpClientPayload, type ErpClientVehiclePayload } from "../types/clients-types"

export interface ClientsGateway {
  listClientsPayload: () => Promise<readonly ErpClientPayload[]>
  listClientVehiclesPayload: () => Promise<readonly ErpClientVehiclePayload[]>
}

const defaultBatchSize = 500
const maxBatches = 20

async function fetchAllBatches<TRow>(loader: (from: number, to: number) => Promise<readonly TRow[]>) {
  const rows: TRow[] = []

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const from = batch * defaultBatchSize
    const to = from + defaultBatchSize - 1
    const chunk = await loader(from, to)

    rows.push(...chunk)

    if (chunk.length < defaultBatchSize) {
      return rows
    }
  }

  throw new Error("A busca de clientes excedeu o limite seguro de páginas.")
}

function createSupabaseClientsGateway(): ClientsGateway {
  return {
    async listClientsPayload() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        return []
      }

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
          throw new Error(error.message)
        }

        return (data ?? []) as readonly ErpClientPayload[]
      })
    },
    async listClientVehiclesPayload() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        return []
      }

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
          throw new Error(error.message)
        }

        return (data ?? []) as readonly ErpClientVehiclePayload[]
      })
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
