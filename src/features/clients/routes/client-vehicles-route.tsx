import { ArrowLeftIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
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
  getVehicleVipStatus,
  useVipRules,
} from "@/features/rules"
import { clientsCopy } from "../clients-copy"
import {
  createClientVehiclesColumns,
} from "../columns/client-vehicles-columns"
import { ClientsSyncHistoryDialog } from "../components/clients-sync-history-dialog"
import { useClientSyncHistory } from "../hooks/use-client-sync-history"
import { useClientVehicles } from "../hooks/use-client-vehicles"
import {
  isClientSyncInProgressError,
  triggerClientsSync,
} from "../services/client-sync-service"
import { type ClientVehicleTableRow } from "../types/clients-types"
import { mapClientVehicleToTableRow } from "../utils/clients-table-mappers"

const CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.client-vehicles.columns.v1"
const clientsSyncTimeoutMs = 90_000

function parseCodPessoa(value: string | undefined) {
  const normalized = Number(value)

  return Number.isFinite(normalized) ? Math.trunc(normalized) : 0
}

function normalizeDisplayText(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function ClientVehiclesRoute() {
  const navigate = useNavigate()
  const { profile } = useAuthSession()
  const { cod_pessoa: codPessoaParam } = useParams<{ cod_pessoa: string }>()
  const codPessoa = React.useMemo(
    () => parseCodPessoa(codPessoaParam),
    [codPessoaParam]
  )
  const { client, data, error, isLoading, refetch } = useClientVehicles(codPessoa)
  const {
    data: syncHistory,
    error: syncHistoryError,
    isLoading: isLoadingSyncHistory,
    refetch: refetchSyncHistory,
  } = useClientSyncHistory()
  const { data: vipRules, toggleVehicleVip } = useVipRules()
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [syncDialogPhase, setSyncDialogPhase] = React.useState<"confirm" | "running" | null>(null)

  const role = isUserRole(profile?.role) ? profile.role : null
  const canSyncClients = hasCapability(role, "admin.clients.manage")
  const isSyncing = syncDialogPhase === "running"
  const tableData = React.useMemo<ClientVehicleTableRow[]>(() => {
    return data.map((vehicle) =>
      mapClientVehicleToTableRow(vehicle, {
        isVipEnabled: getVehicleVipStatus(vehicle, vipRules),
      })
    )
  }, [data, vipRules])

  const columns = React.useMemo(
    () =>
      createClientVehiclesColumns({
        vipActionLabel: clientsCopy.actions.toggleVehicleVip,
        onToggleVip: (vehicle: ClientVehicleTableRow) => {
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
        },
      }),
    [toggleVehicleVip]
  )
  const plateOptions = React.useMemo(
    () =>
      createDataTableFilterOptions<ClientVehicleTableRow, string>(
        tableData,
        (vehicle: ClientVehicleTableRow) => vehicle.num_placa,
        (vehicle: ClientVehicleTableRow) => vehicle.num_placa
      ),
    [tableData]
  )
  const vipOptions = React.useMemo(
    () =>
      createDataTableFilterOptions<ClientVehicleTableRow, "sim" | "nao">(
        tableData,
        (vehicle: ClientVehicleTableRow) => vehicle.vip,
        (vehicle: ClientVehicleTableRow) => (vehicle.vip === "sim" ? "Sim" : "Não")
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
        headingContent={(
          <>
            <h1 className="text-2xl font-semibold">
              {client?.nom_pessoa
                ? normalizeDisplayText(client.nom_pessoa)
                : clientsCopy.pages.clientVehicles.fallbackTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Voltar para clientes"
                onClick={() => {
                  void navigate("/clientes")
                }}
              >
                <ArrowLeftIcon aria-hidden="true" />
              </Button>
              <p className="text-sm text-muted-foreground">
                {client?.num_cnpj_cpf || clientsCopy.pages.clientVehicles.subtitleFallback}
              </p>
            </div>
          </>
        )}
        actions={(
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (syncHistoryError && !isLoadingSyncHistory) {
                  notify.error(clientsCopy.sync.historyLoadError)
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
                disabled={isLoading || isSyncing}
                onClick={() => {
                  setSyncDialogPhase("confirm")
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
        columnVisibilityStorageKey={CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(vehicle: ClientVehicleTableRow) => String(vehicle.cod_veiculo)}
        globalSearch={{
          columnIds: [
            "cod_veiculo",
            "nom_pessoa",
            "num_cnpj_cpf",
            "num_placa",
            "des_veiculo",
            "nom_motorista",
          ],
          placeholder: "Buscar veículos...",
        }}
        filterFields={[
          {
            id: "num_placa",
            title: "Placas",
            options: plateOptions,
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
