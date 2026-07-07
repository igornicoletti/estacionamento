import { HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { ManualSyncDialog } from "@/components/sync"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
  hasCapability,
  isUserRole,
  useAuthSession,
} from "@/features/auth"
import { withTimeout } from "@/lib/promise"

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
import {
  isClientSyncInProgressError,
  triggerClientsSync,
} from "../services/client-sync-service"
import { type ClientTableRow } from "../types/clients-types"
import { mapClientToTableRow } from "../utils/clients-table-mappers"

const CLIENTS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.clients.columns.v1"
const clientsSyncTimeoutMs = 90_000

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
  const [syncDialogPhase, setSyncDialogPhase] = React.useState<"confirm" | "running" | null>(null)

  const role = isUserRole(profile?.role) ? profile.role : null
  const canSyncClients = hasCapability(role, "admin.clients.manage")
  const canManageClients = hasCapability(role, "admin.clients.manage")
  const isSyncing = syncDialogPhase === "running"
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

  async function handleConfirmSync() {
    if (isSyncing) {
      return
    }

    setSyncDialogPhase("running")

    try {
      const result = await withTimeout(
        triggerClientsSync("incremental").then(async (syncResult) => {
          await Promise.all([refetch(), refetchSyncHistory()])
          return syncResult
        }),
        clientsSyncTimeoutMs,
        new Error(clientsCopy.sync.timeoutError)
      )

      if (result.status === "failed") {
        notify.error(clientsCopy.sync.feedback.error)
        return
      }

      if (result.status === "warning") {
        notify.warning(clientsCopy.sync.feedback.inProgress)
        return
      }

      notify.success(clientsCopy.sync.feedback.success)
    } catch (caughtError) {
      if (isClientSyncInProgressError(caughtError)) {
        notify.warning(clientsCopy.sync.feedback.inProgress)
      } else {
        notify.error(clientsCopy.sync.feedback.error)
      }
    } finally {
      setSyncDialogPhase(null)
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
            {canSyncClients ? (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isLoading || isSyncing}
                onClick={() => {
                  setSyncDialogPhase("confirm")
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
        error={syncHistoryError}
        onRetry={() => {
          void refetchSyncHistory()
        }}
      />

      <ManualSyncDialog
        open={syncDialogPhase !== null}
        phase={syncDialogPhase === "running" ? "running" : "confirm"}
        confirmTitle={clientsCopy.sync.confirmTitle}
        confirmDescription={clientsCopy.sync.confirmDescription}
        runningTitle={clientsCopy.sync.runningTitle}
        runningDescription={clientsCopy.sync.runningDescription}
        confirmLabel={clientsCopy.sync.confirmButton}
        cancelLabel={clientsCopy.sync.cancelButton}
        onConfirm={() => {
          void handleConfirmSync()
        }}
        onOpenChange={(open) => {
          if (!open && !isSyncing) {
            setSyncDialogPhase(null)
          }
        }}
      />
    </PageSection>
  )
}
