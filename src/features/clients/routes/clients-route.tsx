import { HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"

import {
  getClientVipStatus,
  useVipRules,
} from "@/features/rules"
import { clientsCopy } from "../clients-copy"
import {
  createClientsColumns,
} from "../columns/clients-columns"
import { useClients } from "../hooks/use-clients"
import { type ClientTableRow } from "../types/clients-types"
import { mapClientToTableRow } from "../utils/clients-table-mappers"

const CLIENTS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.clients.columns.v1"

export function ClientsRoute() {
  const navigate = useNavigate()
  const { data: clients, error, isLoading, refetch } = useClients()
  const { data: vipRules, toggleClientVip } = useVipRules()
  const tableData = React.useMemo<ClientTableRow[]>(() => {
    return clients.map((client) => {
      return mapClientToTableRow(client, {
        isVipEnabled: getClientVipStatus(client, vipRules),
      })
    })
  }, [clients, vipRules])

  const columns = React.useMemo(
    () =>
      createClientsColumns({
        onSelectVehicles: (client) => {
          void navigate(`/clientes/${client.cod_pessoa}`)
        },
        vipActionLabel: clientsCopy.actions.toggleClientVip,
        onToggleVip: (client) => {
          void notify.promise(
            toggleClientVip({
              clientId: client.cod_pessoa,
              clientName: client.nom_pessoa,
              enabled: client.vip !== "sim",
            }),
            clientsCopy.feedback.clientVip
          )
        },
      }),
    [navigate, toggleClientVip]
  )
  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        tableData,
        (client) => client.status,
        (client) => (client.status === "ativo" ? "Ativo" : "Inativo")
      ),
    [tableData]
  )
  const vipOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        tableData,
        (client) => client.vip,
        (client) => (client.vip === "sim" ? "Sim" : "Não")
      ),
    [tableData]
  )

  return (
    <PageSection>
      <PageHeader
        title={clientsCopy.pages.clients.title}
        subtitle={clientsCopy.pages.clients.subtitle}
        actions={(
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            <Button type="button" variant="secondary" >
              <HistoryIcon aria-hidden="true" />
              {clientsCopy.actions.history}
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
              {clientsCopy.actions.sync}
            </Button>
          </div>
        )}
      />

      <DataTable
        columns={columns}
        data={tableData}
        columnVisibilityStorageKey={CLIENTS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(client) => String(client.cod_pessoa)}
        globalSearch={{
          columnIds: [
            "cod_pessoa",
            "nom_pessoa",
            "num_cnpj_cpf",
            "nom_cidade",
            "qtd_veiculos",
          ],
          placeholder: "Buscar clientes...",
        }}
        filterFields={[
          {
            id: "status",
            title: "Status",
            options: statusOptions,
          },
          {
            id: "vip",
            title: "VIP",
            options: vipOptions,
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
    </PageSection>
  )
}
