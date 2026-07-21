import { ArrowLeftIcon, DatabaseIcon, ShieldAlertIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"
import { getVehicleVipStatus, useVipRules } from "@/features/rules"

import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY,
  DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY,
} from "../constants/clients-persistence"
import { clientsRoutePaths } from "../constants/clients-routes"
import {
  useClientVehicles,
  useClientVehiclesTableFilters,
  useClients,
} from "../hooks"
import {
  getClientVehicleDetailItems,
  mapClientVehicleToTableRow,
  normalizeDisplayName,
  parseClientRouteId,
  type ClientVehicleTableRow,
} from "../model"
import { createClientVehiclesColumns } from "../table"

function canReadClientVehicles(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.clientVehiclesRead)
}

function canManageVipRules(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.rulesManage)
}

export function ClientVehiclesRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const params = useParams<{ cod_pessoa: string }>()
  const parsedClientId = React.useMemo(() => parseClientRouteId(params.cod_pessoa), [params.cod_pessoa])
  const clientId = parsedClientId ?? null
  const {
    data: clients,
    error: clientsError,
    isLoading: isLoadingClients,
    refetch: refetchClients,
  } = useClients()
  const client = React.useMemo(
    () => clients.find((item) => item.cod_pessoa === clientId) ?? null,
    [clientId, clients]
  )
  const shouldLoadVehicles = Boolean(client)
  const {
    data: vehicles,
    error: vehiclesError,
    isLoading: isLoadingVehicles,
    refetch: refetchVehicles,
  } = useClientVehicles(clientId, { enabled: shouldLoadVehicles })
  const { data: vipRules, refetch: refetchVipRules, toggleVehicleVip } = useVipRules()
  const [selectedVehicle, setSelectedVehicle] = React.useState<ClientVehicleTableRow | null>(null)
  const [pendingVipVehicleId, setPendingVipVehicleId] = React.useState<number | null>(null)
  const canRead = canReadClientVehicles(auth)
  const canManageVip = canManageVipRules(auth)
  const tableData = React.useMemo<ClientVehicleTableRow[]>(() => {
    return vehicles.map((vehicle) => mapClientVehicleToTableRow(vehicle, {
      isVipEnabled: getVehicleVipStatus(vehicle, vipRules),
    }))
  }, [vehicles, vipRules])
  const filterFields = useClientVehiclesTableFilters(tableData)
  const isResolvingClient = Boolean(clientId) && isLoadingClients && !client
  const isClientUnavailable = !isResolvingClient && !client
  const pageTitle = client?.nom_pessoa
    ? normalizeDisplayName(client.nom_pessoa)
    : isResolvingClient
      ? clientsCopy.pages.clients.title
      : clientsCopy.pages.clientVehicles.fallbackTitle
  const pageSubtitle = client?.num_cnpj_cpf
    ?? (isResolvingClient ? clientsCopy.pages.clients.subtitle : clientsCopy.pages.clientVehicles.fallbackDescription)
  const tableError = clientsError ?? vehiclesError
  const tableVehicles = client ? tableData : []

  const handleRetry = React.useCallback(async () => {
    await Promise.allSettled([
      refetchClients(),
      shouldLoadVehicles ? refetchVehicles() : Promise.resolve([]),
    ])
  }, [refetchClients, refetchVehicles, shouldLoadVehicles])

  const handleToggleVehicleVip = React.useCallback(async (vehicle: ClientVehicleTableRow) => {
    if (pendingVipVehicleId !== null) {
      return
    }

    setPendingVipVehicleId(vehicle.cod_veiculo)

    try {
      await toggleVehicleVip({
        clientId: vehicle.cod_pessoa,
        clientName: vehicle.nom_pessoa,
        enabled: vehicle.vip !== "sim",
        vehicleId: vehicle.cod_veiculo,
        vehiclePlate: vehicle.num_placa,
      })
      await refetchVipRules()
      notify.success(clientsCopy.feedback.vehicleVip.success)
    } catch {
      notify.error(clientsCopy.feedback.vehicleVip.error)
    } finally {
      setPendingVipVehicleId(null)
    }
  }, [pendingVipVehicleId, refetchVipRules, toggleVehicleVip])

  const columns = React.useMemo(
    () =>
      createClientVehiclesColumns({
        onOpenDetails: setSelectedVehicle,
        onToggleVip: canManageVip
          ? (vehicle) => {
            void handleToggleVehicleVip(vehicle)
          }
          : undefined,
        pendingVipVehicleId,
        vipActionLabel: clientsCopy.actions.toggleVehicleVip,
      }),
    [canManageVip, handleToggleVehicleVip, pendingVipVehicleId]
  )

  return (
    <PageSection>
      <PageHeader
        title={parsedClientId === null ? clientsCopy.pages.clientVehicles.invalidTitle : pageTitle}
        subtitle={parsedClientId === null ? clientsCopy.pages.clientVehicles.invalidDescription : pageSubtitle}
        actions={(
          <PageHeaderActions>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                void navigate(clientsRoutePaths.list)
              }}
            >
              <ArrowLeftIcon aria-hidden="true" />
              {clientsCopy.actions.backToClients}
            </Button>
          </PageHeaderActions>
        )}
      />

      {canRead ? (
        <DataTable
          columns={columns}
          data={parsedClientId === null ? [] : tableVehicles}
          defaultColumnVisibility={DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY}
          columnVisibilityStorageKey={CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY}
          getRowId={(vehicle: ClientVehicleTableRow) => String(vehicle.cod_veiculo)}
          globalSearch={{
            columnIds: ["cod_veiculo", "nom_pessoa", "num_cnpj_cpf", "num_placa", "des_veiculo", "nom_motorista"],
            placeholder: clientsCopy.pages.clientVehicles.searchPlaceholder,
          }}
          filterFields={filterFields}
          emptyState={(
            <AppEmptyState
              media={<DatabaseIcon />}
              title={
                parsedClientId === null
                  ? clientsCopy.pages.clientVehicles.invalidTitle
                  : isClientUnavailable
                    ? clientsCopy.pages.clientVehicles.fallbackTitle
                    : clientsCopy.empty.vehiclesTitle
              }
              description={
                parsedClientId === null
                  ? clientsCopy.pages.clientVehicles.invalidDescription
                  : isClientUnavailable
                    ? clientsCopy.pages.clientVehicles.fallbackDescription
                    : clientsCopy.empty.vehiclesDescription
              }
            />
          )}
          filteredEmptyState={(
            <AppEmptyState
              media={<DatabaseIcon />}
              title={clientsCopy.filteredEmpty.vehiclesTitle}
              description={clientsCopy.filteredEmpty.vehiclesDescription}
            />
          )}
          isLoading={parsedClientId !== null && (isLoadingClients || (shouldLoadVehicles && isLoadingVehicles))}
          error={tableError}
          onRetry={() => {
            void handleRetry()
          }}
          enablePagination
          enableViewOptions
        />
      ) : (
        <AppEmptyState
          media={<ShieldAlertIcon />}
          title={clientsCopy.pages.clientVehicles.accessDeniedTitle}
          description={clientsCopy.pages.clientVehicles.accessDeniedDescription}
        />
      )}

      <AppDetailsSheet
        open={Boolean(selectedVehicle)}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedVehicle(null)
          }
        }}
        title={selectedVehicle?.num_placa}
        description={selectedVehicle?.nom_pessoa}
        items={selectedVehicle ? getClientVehicleDetailItems(selectedVehicle) : []}
      />
    </PageSection>
  )
}
