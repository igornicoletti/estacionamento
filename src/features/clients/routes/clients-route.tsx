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
  hasCapability,
  isUserRole,
  useAuthSession,
} from "@/features/auth"

import {
  getClientVipStatus,
  useVipRules,
} from "@/features/rules"
import { clientsCopy } from "../clients-copy"
import {
  createClientsColumns,
} from "../columns/clients-columns"
import { ClientsSyncHistoryDialog } from "../components/clients-sync-history-dialog"
import { useClientSyncHistory } from "../hooks/use-client-sync-history"
import { useClients } from "../hooks/use-clients"
import { triggerClientsSync } from "../services/client-sync-service"
import { type ClientTableRow } from "../types/clients-types"
import { mapClientToTableRow } from "../utils/clients-table-mappers"

const CLIENTS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.clients.columns.v1"

export function ClientsRoute() {
  const navigate = useNavigate()
  const { profile } = useAuthSession()
  const { data: clients, error, isLoading, refetch } = useClients()
  const {
    data: syncHistory,
    error: syncHistoryError,
    isLoading: isLoadingSyncHistory,
    refetch: refetchSyncHistory,
  } = useClientSyncHistory()
  const { data: vipRules, toggleClientVip } = useVipRules()
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)

  const role = isUserRole(profile?.role) ? profile.role : null
  const canSyncClients = hasCapability(role, "admin.clients.manage")
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (syncHistoryError && !isLoadingSyncHistory) {
                  notify.error("Nao foi possivel carregar o historico de sincronizacao.")
                  return
                }

                setIsHistoryOpen(true)
              }}
            >
              <HistoryIcon aria-hidden="true" />
              {clientsCopy.actions.history}
            </Button>
            {canSyncClients ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => {
                  void notify.track(
                    triggerClientsSync("incremental").then(async (result) => {
                      await Promise.all([refetch(), refetchSyncHistory()])
                      return result
                    }),
                    {
                      loading: "Sincronizando clientes com o ERP...",
                      success: "Sincronizacao concluida.",
                      error: "Nao foi possivel sincronizar os clientes.",
                    }
                  )
                }}
              >
                <RefreshCcwIcon aria-hidden="true" />
                {clientsCopy.actions.sync}
              </Button>
            ) : null}
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

      <ClientsSyncHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        entries={syncHistory}
        isLoading={isLoadingSyncHistory}
      />
    </PageSection>
  )
}
