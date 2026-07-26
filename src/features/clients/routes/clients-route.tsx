import { HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import {
  createDataTableFilterOptions,
  defineDataTableCustomColumnId,
  DataTable,
} from "@/components/data-table"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"
import { Button } from "@/components/ui/button"

import {
  getClientDetailItems,
  type ClientTableRow,
} from "../model"
import { createClientsColumns } from "../table"
import { useClients } from "../hooks/use-clients"

const cityStateColumnId = defineDataTableCustomColumnId("cidadeUf")

function formatCityState(client: ClientTableRow) {
  return [client.nom_cidade, client.sgl_estado].filter(Boolean).join("/")
}

export function ClientsRoute() {
  const navigate = useNavigate()
  const { data: clients, error, isLoading, refetch } = useClients()
  const [selectedClient, setSelectedClient] =
    React.useState<ClientTableRow | null>(null)
  const columns = React.useMemo(
    () =>
      createClientsColumns({
        onOpenDetails: setSelectedClient,
        onSelectVehicles: (client) => {
          void navigate(`/clientes/${client.cod_pessoa}`)
        },
      }),
    [navigate]
  )
  const stateOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        clients,
        (client) => formatCityState(client),
        (client) => formatCityState(client)
      ),
    [clients]
  )
  const activeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        clients,
        (client) => client.status,
        (client) => (client.status === "ativo" ? "Ativo" : "Inativo")
      ),
    [clients]
  )

  return (
    <AppPage
      title="Clientes"
      subtitle="Consulte os clientes sincronizados a partir do ERP."
      actions={
        <>
          <Button type="button" variant="secondary" >
            <HistoryIcon aria-hidden="true" />
            Historico
          </Button>
          <Button
            type="button"
            variant="secondary"

            disabled={isLoading}
            onClick={() => {
              void refetch()
            }}
          >
            <RefreshCcwIcon aria-hidden="true" />
            Sincronizar
          </Button>
        </>
      }
    >
      <DataTable
        columns={columns}
        data={clients}
        getRowId={(client) => String(client.cod_pessoa)}
        globalSearch={{
          columnIds: [
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
          ],
          placeholder: "Buscar clientes...",
        }}
        filterFields={[
          {
            id: cityStateColumnId,
            title: "Cidades",
            options: stateOptions,
          },
          {
            id: "status",
            title: "Ativo",
            options: activeOptions,
          },
        ]}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedClient)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedClient(null)
          }
        }}
        title={selectedClient ? "Detalhes do cliente" : undefined}
        description={
          selectedClient
            ? "Consulte os dados cadastrais e comerciais do cliente selecionado."
            : undefined
        }
        items={selectedClient ? getClientDetailItems(selectedClient) : []}
      />
    </AppPage>
  )
}
