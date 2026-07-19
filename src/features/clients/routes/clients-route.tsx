import { DatabaseIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"
import { getClientVipStatus, useVipRules } from "@/features/rules"
import { executeSyncWithRefresh, SyncBlockingDialog } from "@/features/sync"

import { ClientsSyncHistoryDialog } from "../components"
import { CLIENTS_TABLE_COLUMN_VISIBILITY_KEY, clientsCopy } from "../constants"
import { useClients, useClientSyncHistory } from "../hooks"
import { getClientDetailItems, mapClientToTableRow, type ClientTableRow } from "../model"
import { isClientSyncInProgressError, triggerClientsSync } from "../services"
import {
  createClientsColumns,
  createClientStatusFilterOptions,
  createClientVipFilterOptions,
} from "../table"

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
    return clients.map((client) => mapClientToTableRow(client, {
      isVipEnabled: getClientVipStatus(client, vipRules),
    }))
  }, [clients, vipRules])

  const columns = React.useMemo(
    () => createClientsColumns({
      onOpenDetails: setSelectedClient,
      onSelectVehicles: (client) => {
        void navigate(`/clientes/${client.cod_pessoa}`)
      },
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
      vipActionLabel: clientsCopy.actions.toggleClientVip,
    }),
    [canManageClients, navigate, toggleClientVip]
  )
  const statusOptions = React.useMemo(
    () => createClientStatusFilterOptions(tableData),
    [tableData]
  )
  const vipOptions = React.useMemo(
    () => createClientVipFilterOptions(tableData),
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
      await executeSyncWithRefresh({
        triggerSync: () => triggerClientsSync("incremental"),
        refreshSnapshots: refreshOperationalSnapshots,
        isInProgressError: isClientSyncInProgressError,
        onSuccess: () => {
          notify.success(clientsCopy.sync.feedback.success)
        },
        onWarning: () => {
          notify.warning(clientsCopy.sync.feedback.inProgress)
        },
        onError: () => {
          notify.error(clientsCopy.sync.feedback.error)
        },
      })
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
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                setIsHistoryOpen(true)
              }}
            >
              <HistoryIcon aria-hidden="true" />
              {clientsCopy.actions.history}
            </Button>
            {canManageClients ? (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isLoading || isSyncing}
                onClick={() => {
                  void handleStartSync()
                }}
              >
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
        columnVisibilityStorageKey={CLIENTS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(client) => String(client.cod_pessoa)}
        globalSearch={{
          columnIds: ["cod_pessoa", "nom_pessoa", "nom_fantasia", "num_cnpj_cpf", "nom_cidade", "qtd_veiculos"],
          placeholder: clientsCopy.pages.clients.searchPlaceholder,
        }}
        filterFields={[
          { id: "status", title: clientsCopy.filters.status, options: statusOptions },
          { id: "vip", title: clientsCopy.filters.vip, options: vipOptions },
        ]}
        emptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={clientsCopy.empty.clientsTitle}
            description={clientsCopy.empty.clientsDescription}
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={clientsCopy.filteredEmpty.clientsTitle}
            description={clientsCopy.filteredEmpty.clientsDescription}
          />
        )}
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
        onRetry={() => {
          void refetchSyncHistory()
        }}
      />

      <SyncBlockingDialog
        open={isSyncing}
        title={clientsCopy.sync.runningTitle}
        description={clientsCopy.sync.runningDescription}
      />
    </PageSection>
  )
}
