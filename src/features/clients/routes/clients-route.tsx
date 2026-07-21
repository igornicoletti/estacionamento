import { DatabaseIcon, HistoryIcon, RefreshCcwIcon, ShieldAlertIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import { DataTable, DataTableSensitiveValue } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"

import { ClientSyncBlockingDialog, ClientsSyncHistoryDialog } from "../components"
import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENTS_TABLE_COLUMN_VISIBILITY_KEY,
  DEFAULT_CLIENTS_COLUMN_VISIBILITY,
} from "../constants/clients-persistence"
import { CLIENT_SYNC_DEFAULT_MODE } from "../constants/clients-sync"
import { clientsRoutePaths } from "../constants/clients-routes"
import {
  useClientSyncHistory,
  useClientVipRules,
  useClients,
  useClientsTableFilters,
} from "../hooks"
import { getClientDetailItems, getClientVipStatus, mapClientToTableRow, type ClientTableRow } from "../model"
import {
  executeClientSyncWithRefresh,
  isClientSyncInProgressError,
  triggerClientsSync,
} from "../services"
import { createClientsColumns } from "../table"

function canReadClients(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.clientsRead)
}

function canReadClientSyncHistory(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.clientsSyncRead)
    || auth.access.hasPermission(AUTH_PERMISSION.syncExecute)
    || auth.access.hasPermission(AUTH_PERMISSION.auditRead)
}

function canExecuteClientSync(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.syncExecute)
}

function canManageVipRules(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.rulesManage)
}

export function ClientsRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const canRead = canReadClients(auth)
  const canReadHistory = canReadClientSyncHistory(auth)
  const canSync = canExecuteClientSync(auth)
  const canManageVip = canManageVipRules(auth)
  const { data: clients, error, isLoading, refetch } = useClients()
  const {
    data: syncHistory,
    error: syncHistoryError,
    isLoading: isLoadingSyncHistory,
    refetch: refetchSyncHistory,
  } = useClientSyncHistory({ enabled: canReadHistory })
  const {
    data: vipRules,
    error: vipRulesError,
    refetch: refetchVipRules,
    toggleClientVip,
  } = useClientVipRules({ enabled: canRead })
  const [selectedClient, setSelectedClient] = React.useState<ClientTableRow | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [pendingVipClientId, setPendingVipClientId] = React.useState<number | null>(null)
  const tableData = React.useMemo<ClientTableRow[]>(() => {
    return clients.map((client) => mapClientToTableRow(client, {
      isVipEnabled: getClientVipStatus(client, vipRules),
    }))
  }, [clients, vipRules])
  const filterFields = useClientsTableFilters(tableData)

  const handleOpenDetails = React.useCallback((client: ClientTableRow) => {
    setSelectedClient(client)
  }, [])

  const handleSelectVehicles = React.useCallback(
    (client: ClientTableRow) => {
      void navigate(clientsRoutePaths.vehicles(client.cod_pessoa))
    },
    [navigate]
  )

  const handleToggleClientVip = React.useCallback(async (client: ClientTableRow) => {
    if (pendingVipClientId !== null) {
      return
    }

    setPendingVipClientId(client.cod_pessoa)

    try {
      await toggleClientVip({
        clientId: client.cod_pessoa,
        clientName: client.nom_pessoa,
        enabled: client.vip !== "sim",
      })
      await refetchVipRules()
      notify.success(clientsCopy.feedback.clientVip.success)
    } catch {
      notify.error(clientsCopy.feedback.clientVip.error)
    } finally {
      setPendingVipClientId(null)
    }
  }, [pendingVipClientId, refetchVipRules, toggleClientVip])

  const columns = React.useMemo(
    () =>
      createClientsColumns({
        onOpenDetails: handleOpenDetails,
        onSelectVehicles: handleSelectVehicles,
        onToggleVip: canManageVip && !vipRulesError
          ? (client) => {
            void handleToggleClientVip(client)
          }
          : undefined,
        pendingVipClientId,
      }),
    [canManageVip, handleOpenDetails, handleSelectVehicles, handleToggleClientVip, pendingVipClientId, vipRulesError]
  )

  const refreshOperationalSnapshots = React.useCallback(async () => {
    await Promise.allSettled([refetch(), refetchSyncHistory(), refetchVipRules()])
  }, [refetch, refetchSyncHistory, refetchVipRules])

  const handleStartSync = React.useCallback(async () => {
    if (isSyncing) {
      return
    }

    setIsSyncing(true)

    try {
      await executeClientSyncWithRefresh({
        triggerSync: () => triggerClientsSync(CLIENT_SYNC_DEFAULT_MODE),
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
  }, [isSyncing, refreshOperationalSnapshots])

  if (!canRead) {
    return (
      <PageSection>
        <PageHeader
          title={clientsCopy.pages.clients.title}
          subtitle={clientsCopy.pages.clients.subtitle}
        />
        <AppEmptyState
          media={<ShieldAlertIcon />}
          title={clientsCopy.pages.clients.accessDeniedTitle}
          description={clientsCopy.pages.clients.accessDeniedDescription}
        />
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageHeader
        title={clientsCopy.pages.clients.title}
        subtitle={clientsCopy.pages.clients.subtitle}
        actions={(
          <PageHeaderActions>
            {canReadHistory ? (
              <Button type="button" variant="secondary" size="lg" onClick={() => setIsHistoryOpen(true)}>
                <HistoryIcon aria-hidden="true" />
                {clientsCopy.actions.history}
              </Button>
            ) : null}
            {canSync ? (
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
        defaultColumnVisibility={DEFAULT_CLIENTS_COLUMN_VISIBILITY}
        columnVisibilityStorageKey={CLIENTS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(client: ClientTableRow) => String(client.cod_pessoa)}
        globalSearch={{
          columnIds: [
            "cod_pessoa",
            "nom_pessoa",
            "nom_fantasia",
            "num_cnpj_cpf",
            "des_email_1",
            "num_telefone_1",
            "nom_cidade",
            "qtd_veiculos",
          ],
          placeholder: clientsCopy.pages.clients.searchPlaceholder,
        }}
        filterFields={filterFields}
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
        description={(
          <DataTableSensitiveValue
            value={selectedClient?.num_cnpj_cpf}
            kind="cpfCnpj"
          />
        )}
        items={selectedClient ? getClientDetailItems(selectedClient) : []}
      />

      {canReadHistory ? (
        <ClientsSyncHistoryDialog
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          entries={syncHistory}
          isLoading={isLoadingSyncHistory}
          error={syncHistoryError}
          onRetry={() => {
            void refetchSyncHistory()
          }}
          onSync={canSync ? () => {
            void handleStartSync()
          } : undefined}
          isSyncing={isSyncing}
        />
      ) : null}

      <ClientSyncBlockingDialog
        open={isSyncing}
        title={clientsCopy.sync.runningTitle}
        description={clientsCopy.sync.runningDescription}
      />
    </PageSection>
  )
}
