import { HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { Button } from "@/components/ui/button"

import { createClientsColumns } from "../columns/clients-columns"
import { useClients } from "../hooks/use-clients"

export function ClientsRoute() {
  const navigate = useNavigate()
  const { data: clients, error, isLoading, refetch } = useClients()
  const columns = React.useMemo(
    () =>
      createClientsColumns({
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
        (client) => client.sgl_estado,
        (client) => client.sgl_estado
      ),
    [clients]
  )
  const activeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        clients,
        (client) => client.ind_pessoa_ativa,
        (client) => client.ind_pessoa_ativa
      ),
    [clients]
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Consulte os clientes sincronizados a partir do ERP.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
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
        </div>
      </header>

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
            id: "sgl_estado",
            title: "Estados",
            options: stateOptions,
          },
          {
            id: "ind_pessoa_ativa",
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
    </div>
  )
}
