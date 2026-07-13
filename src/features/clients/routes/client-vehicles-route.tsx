import { ArrowLeftIcon, DatabaseIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { createDataTableFilterOptions, DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { ManualSyncDialog } from "@/components/sync"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, AUTH_ROLE_KEY, useAuth } from "@/features/auth"
import { getVehicleVipStatus, useVipRules } from "@/features/rules"
import { withTimeout } from "@/lib/promise"

import { clientsCopy } from "../clients-copy"
import { createClientVehiclesColumns } from "../columns/client-vehicles-columns"
import { ClientsSyncHistoryDialog } from "../components/clients-sync-history-dialog"
import { useClientSyncHistory } from "../hooks/use-client-sync-history"
import { useClientVehicles } from "../hooks/use-client-vehicles"
import { isClientSyncInProgressError, triggerClientsSync } from "../services/client-sync-service"
import { type ClientVehicleTableRow } from "../types/clients-types"
import { getClientVehicleDetailItems } from "../utils/clients-details-model"
import { mapClientVehicleToTableRow } from "../utils/clients-table-mappers"

const clientVehiclesTableColumnVisibilityKey = "rmc.table.client-vehicles.columns.v2"
const clientsSyncTimeoutMs = 90_000

function parseClientId(value: string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}

function normalizeDisplayText(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function canManageOperationalData(auth: ReturnType<typeof useAuth>) {
  return (
    auth.access.hasPermission(AUTH_PERMISSION.all) ||
    auth.profile?.role?.key === AUTH_ROLE_KEY.owner ||
    auth.profile?.role?.key === AUTH_ROLE_KEY.admin
  )
}

export function ClientVehiclesRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const params = useParams<{ cod_pessoa: string }>()
  const clientId = React.useMemo(() => parseClientId(params.cod_pessoa), [params.cod_pessoa])
  const { client, data, error, isLoading, refetch } = useClientVehicles(clientId)
  const {
    data: syncHistory,
    error: syncHistoryError,
    isLoading: isLoadingSyncHistory,
    refetch: refetchSyncHistory,
  } = useClientSyncHistory()
  const { data: vipRules, toggleVehicleVip } = useVipRules()
  const [selectedVehicle, setSelectedVehicle] = React.useState<ClientVehicleTableRow | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [syncDialogPhase, setSyncDialogPhase] = React.useState<"confirm" | "running" | null>(null)

  const canManageClients = canManageOperationalData(auth)
  const isSyncing = syncDialogPhase === "running"
  const tableData = React.useMemo<ClientVehicleTableRow[]>(() => {
    return data.map((vehicle) => mapClientVehicleToTableRow(vehicle, { isVipEnabled: getVehicleVipStatus(vehicle, vipRules) }))
  }, [data, vipRules])

  const columns = React.useMemo(
    () => createClientVehiclesColumns({
      onOpenDetails: setSelectedVehicle,
      vipActionLabel: clientsCopy.actions.toggleVehicleVip,
      onToggleVip: canManageClients
        ? (vehicle) => {
            void notify.promise(
              toggleVehicleVip({
                clientId: vehicle.cod_pessoa,
                clientName: vehicle.nom_pessoa,
                vehicleId: vehicle.cod_veiculo,
                vehiclePlate: vehicle.num_placa,
                enabled: vehicle.vip !== "sim",
              }),
              clientsCopy.feedback.vehicleVip
            )
          }
        : undefined,
    }),
    [canManageClients, toggleVehicleVip]
  )
  const plateOptions = React.useMemo(
    () => createDataTableFilterOptions(tableData, (vehicle) => vehicle.num_placa, (vehicle) => vehicle.num_placa),
    [tableData]
  )
  const vipOptions = React.useMemo(
    () => createDataTableFilterOptions(tableData, (vehicle) => vehicle.vip, (vehicle) => vehicle.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no),
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
        headingContent={(
          <>
            <h1 className="text-2xl font-semibold">
              {client?.nom_pessoa ? normalizeDisplayText(client.nom_pessoa) : clientsCopy.pages.clientVehicles.fallbackTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {client?.num_cnpj_cpf || clientsCopy.pages.clientVehicles.fallbackDescription}
            </p>
          </>
        )}
        actions={(
          <PageHeaderActions>
            <Button type="button" variant="secondary" size="lg" onClick={() => { void navigate("/clientes") }}>
              <ArrowLeftIcon aria-hidden="true" />
              {clientsCopy.actions.backToClients}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => setIsHistoryOpen(true)}>
              <HistoryIcon aria-hidden="true" />
              {clientsCopy.actions.history}
            </Button>
            {canManageClients ? (
              <Button type="button" variant="secondary" size="lg" disabled={isLoading || isSyncing} onClick={() => setSyncDialogPhase("confirm")}>
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
        columnVisibilityStorageKey={clientVehiclesTableColumnVisibilityKey}
        getRowId={(vehicle) => String(vehicle.cod_veiculo)}
        globalSearch={{
          columnIds: ["cod_veiculo", "nom_pessoa", "num_cnpj_cpf", "num_placa", "des_veiculo", "nom_motorista"],
          placeholder: clientsCopy.pages.clientVehicles.searchPlaceholder,
        }}
        filterFields={[
          { id: "num_placa", title: clientsCopy.filters.plates, options: plateOptions },
          { id: "vip", title: clientsCopy.filters.vip, options: vipOptions },
        ]}
        emptyState={<AppEmptyState media={<DatabaseIcon />} title={clientsCopy.empty.vehiclesTitle} description={clientsCopy.empty.vehiclesDescription} />}
        filteredEmptyState={<AppEmptyState media={<DatabaseIcon />} title={clientsCopy.filteredEmpty.vehiclesTitle} description={clientsCopy.filteredEmpty.vehiclesDescription} />}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch() }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => { if (!open) setSelectedVehicle(null) }}
        title={selectedVehicle?.num_placa}
        description={selectedVehicle?.nom_pessoa}
        items={selectedVehicle ? getClientVehicleDetailItems(selectedVehicle) : []}
      />

      <ClientsSyncHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        entries={syncHistory}
        isLoading={isLoadingSyncHistory}
        error={syncHistoryError}
        onRetry={() => { void refetchSyncHistory() }}
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
        onConfirm={() => { void handleConfirmSync() }}
        onOpenChange={(open) => { if (!open && !isSyncing) setSyncDialogPhase(null) }}
      />
    </PageSection>
  )
}
