import { DatabaseIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import { createDataTableFilterOptions, DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"
import { getClientVipStatus, useVipRules } from "@/features/rules"
import { SyncBlockingDialog } from "@/features/sync"

import { clientsCopy } from "../clients-copy"
import { createClientsColumns } from "../columns/clients-columns"
import { ClientsSyncHistoryDialog } from "../components/clients-sync-history-dialog"
import { useClientSyncHistory } from "../hooks/use-client-sync-history"
import { useClients } from "../hooks/use-clients"
import { isClientSyncInProgressError, triggerClientsSync } from "../services/client-sync-service"
import { type ClientTableRow } from "../types/clients-types"
import { getClientDetailItems } from "../utils/clients-details-model"
import { mapClientToTableRow } from "../utils/clients-table-mappers"

const clientsTableColumnVisibilityKey = "rmc.table.clients.columns.v2"

function canManageOperationalData(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.syncExecute)
}

export function ClientsRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { data: clients, error, isLoading, refetch } = useClients()
  const {
    data: syncHistory,
    error: syncHistoryError,
    isLoading: isLoadingSyncHistory,
    refetch: refetchSyncHistory,
  } = useClientSyncHistory()
  const { data: vipRules, toggleClientVip } = useVipRules()
  const [selectedClient, setSelectedClient] = React.useState<ClientTableRow | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)

  const canManageClients = canManageOperationalData(auth)
  const tableData = React.useMemo<ClientTableRow[]>(() => {
    return clients.map((client) => mapClientToTableRow(client, { isVipEnabled: getClientVipStatus(client, vipRules) }))
  }, [clients, vipRules])

  const columns = React.useMemo(
    () => createClientsColumns({
      onOpenDetails: setSelectedClient,
      onSelectVehicles: (client) => { void navigate(`/clientes/${client.cod_pessoa}`) },
      vipActionLabel: clientsCopy.actions.toggleClientVip,
      onToggleVip: canManageClients
        ? (client) => {
            void notify.promise(
              toggleClientVip({
                clientId: client.cod_pessoa,
                clientName: client.nom_pessoa,
                enabled: client.vip !== "sim",
              }),
              clientsCopy.feedback.clientVip
            )
          }
        : undefined,
    }),
    [canManageClients, navigate, toggleClientVip]
  )
  const statusOptions = React.useMemo(
    () => createDataTableFilterOptions(tableData, (client) => client.status, (client) => client.status === "ativo" ? clientsCopy.table.active : clientsCopy.table.inactive),
    [tableData]
  )
  const vipOptions = React.useMemo(
    () => createDataTableFilterOptions(tableData, (client) => client.vip, (client) => client.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no),
    [tableData]
  )

  async function refreshOperationalSnapshots() {
    await Promise.allSettled([refetch(), refetchSyncHistory()])
  }

  async function handleStartSync() {
    if (isSyncing) {
      return
    }

    setIsSyncing(true)

    try {
      const result = await triggerClientsSync("incremental")

      await refreshOperationalSnapshots()

      if (result.status === "failed") {
        notify.error(result.message || clientsCopy.sync.feedback.error)
        return
      }

      if (result.status === "warning") {
        notify.warning(result.message || clientsCopy.sync.feedback.inProgress)
        return
      }

      notify.success(result.message || clientsCopy.sync.feedback.success)
    } catch (caughtError) {
      await refreshOperationalSnapshots()

      if (isClientSyncInProgressError(caughtError)) {
        notify.warning(clientsCopy.sync.feedback.inProgress)
      } else {
        notify.error(
          caughtError instanceof Error && caughtError.message.trim()
            ? caughtError.message
            : clientsCopy.sync.feedback.error
        )
      }
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <PageSection>
      <PageHeader
        title={clientsCopy.pages.clients.title}
        subtitle={clientsCopy.pages.clients.subtitle}
        actions={(
          <PageHeaderActions>
            <Button type="button" variant="secondary" size="lg" onClick={() => setIsHistoryOpen(true)}>
              <HistoryIcon aria-hidden="true" />
              {clientsCopy.actions.history}
            </Button>
            {canManageClients ? (
              <Button type="button" variant="secondary" size="lg" disabled={isLoading || isSyncing} onClick={() => { void handleStartSync() }}>
                <RefreshCcwIcon aria-hidden="true" />
                {clientsCopy.actions.sync}
              </Button>
            ) : null}
          </PageHeaderActions>
        )}
      />

      <DataTable
        columns={columns}
        data={tableData}
        columnVisibilityStorageKey={clientsTableColumnVisibilityKey}
        getRowId={(client) => String(client.cod_pessoa)}
        globalSearch={{
          columnIds: ["cod_pessoa", "nom_pessoa", "num_cnpj_cpf", "nom_cidade", "qtd_veiculos"],
          placeholder: clientsCopy.pages.clients.searchPlaceholder,
        }}
        filterFields={[
          { id: "status", title: clientsCopy.filters.status, options: statusOptions },
          { id: "vip", title: clientsCopy.filters.vip, options: vipOptions },
        ]}
        emptyState={<AppEmptyState media={<DatabaseIcon />} title={clientsCopy.empty.clientsTitle} description={clientsCopy.empty.clientsDescription} />}
        filteredEmptyState={<AppEmptyState media={<DatabaseIcon />} title={clientsCopy.filteredEmpty.clientsTitle} description={clientsCopy.filteredEmpty.clientsDescription} />}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch() }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedClient)}
        onOpenChange={(open) => { if (!open) setSelectedClient(null) }}
        title={selectedClient?.nom_pessoa}
        description={selectedClient?.num_cnpj_cpf}
        items={selectedClient ? getClientDetailItems(selectedClient) : []}
      />

      <ClientsSyncHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        entries={syncHistory}
        isLoading={isLoadingSyncHistory}
        error={syncHistoryError}
        onRetry={() => { void refetchSyncHistory() }}
      />

      <SyncBlockingDialog
        open={isSyncing}
        title={clientsCopy.sync.runningTitle}
        description={clientsCopy.sync.runningDescription}
      />
    </PageSection>
  )
}
