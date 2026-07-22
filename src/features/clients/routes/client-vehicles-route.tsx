import { ArrowLeftIcon, DatabaseIcon, ShieldAlertIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { DataTable, DataTableSensitiveValue } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"

import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY,
  DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY,
} from "../constants/clients-persistence"
import { clientsRoutePaths } from "../constants/clients-routes"
import {
  useClient,
  useClientVehicles,
  useClientVehiclesTableFilters,
  useClientVipRules,
} from "../hooks"
import {
  getClientVehicleDetailItems,
  getVehicleVipStatus,
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
  const canRead = canReadClientVehicles(auth)
  const canManageVip = canManageVipRules(auth)
  const parsedClientId = React.useMemo(() => parseClientRouteId(params.cod_pessoa), [params.cod_pessoa])
  const clientId = parsedClientId ?? null
  const {
    data: client,
    error: clientError,
    isLoading: isLoadingClient,
    refetch: refetchClient,
  } = useClient(clientId, { enabled: parsedClientId !== null })
  const shouldLoadVehicles = Boolean(client)
  const {
    data: vehicles,
    error: vehiclesError,
    isLoading: isLoadingVehicles,
    refetch: refetchVehicles,
  } = useClientVehicles(clientId, { enabled: shouldLoadVehicles })
  const {
    data: vipRules,
    error: vipRulesError,
    refetch: refetchVipRules,
    toggleVehicleVip,
  } = useClientVipRules({ enabled: canRead })
  const [selectedVehicle, setSelectedVehicle] = React.useState<ClientVehicleTableRow | null>(null)
  const [pendingVipVehicleId, setPendingVipVehicleId] = React.useState<number | null>(null)
  const tableData = React.useMemo<ClientVehicleTableRow[]>(() => {
    return vehicles.map((vehicle) => mapClientVehicleToTableRow(vehicle, {
      isVipEnabled: getVehicleVipStatus(vehicle, vipRules),
    }))
  }, [vehicles, vipRules])
  const filterFields = useClientVehiclesTableFilters(tableData)
  const isResolvingClient = Boolean(clientId) && isLoadingClient && !client
  const isClientUnavailable = !isResolvingClient && !client
  const pageTitle = client?.nom_pessoa
    ? normalizeDisplayName(client.nom_pessoa)
    : isResolvingClient
      ? clientsCopy.pages.clients.title
      : clientsCopy.pages.clientVehicles.fallbackTitle
  const pageSubtitle = client?.num_cnpj_cpf
    ? (
      <DataTableSensitiveValue
        value={client.num_cnpj_cpf}
        kind="cpfCnpj"
      />
    )
    : (isResolvingClient ? clientsCopy.pages.clients.subtitle : clientsCopy.pages.clientVehicles.fallbackDescription)
  const tableError = clientError ?? vehiclesError
  const tableVehicles = client ? tableData : []

  const handleRetry = React.useCallback(async () => {
    await Promise.allSettled([
      refetchClient(),
      shouldLoadVehicles ? refetchVehicles() : Promise.resolve([]),
    ])
  }, [refetchClient, refetchVehicles, shouldLoadVehicles])

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
      await Promise.allSettled([refetchVipRules(), refetchVehicles()])
      notify.success(clientsCopy.feedback.vehicleVip.success)
    } catch {
      notify.error(clientsCopy.feedback.vehicleVip.error)
    } finally {
      setPendingVipVehicleId(null)
    }
  }, [pendingVipVehicleId, refetchVehicles, refetchVipRules, toggleVehicleVip])

  const columns = React.useMemo(
    () =>
      createClientVehiclesColumns({
        onOpenDetails: setSelectedVehicle,
        onToggleVip: canManageVip && !vipRulesError
          ? (vehicle) => {
            void handleToggleVehicleVip(vehicle)
          }
          : undefined,
        pendingVipVehicleId,
      }),
    [canManageVip, handleToggleVehicleVip, pendingVipVehicleId, vipRulesError]
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
          isLoading={parsedClientId !== null && (isLoadingClient || (shouldLoadVehicles && isLoadingVehicles))}
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
        title={selectedVehicle ? "Detalhes do veículo" : undefined}
        description={
          selectedVehicle
            ? "Consulte os dados do veículo e do cliente vinculado."
            : undefined
        }
        items={selectedVehicle ? getClientVehicleDetailItems(selectedVehicle) : []}
      />
    </PageSection>
  )
}
