import { ArrowLeftIcon, DatabaseIcon } from "lucide-react"
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

import { CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY, clientsCopy } from "../constants"
import { useClientVehicles } from "../hooks"
import {
  getClientVehicleDetailItems,
  mapClientVehicleToTableRow,
  normalizeDisplayName,
  parseClientRouteId,
  type ClientVehicleTableRow,
} from "../model"
import {
  createClientVehiclesColumns,
  createVehiclePlateFilterOptions,
  createVehicleVipFilterOptions,
} from "../table"

function canManageOperationalData(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.syncExecute)
}

export function ClientVehiclesRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const params = useParams<{ cod_pessoa: string }>()
  const clientId = React.useMemo(() => parseClientRouteId(params.cod_pessoa), [params.cod_pessoa])
  const { client, data, error, isLoading, refetch } = useClientVehicles(clientId)
  const { data: vipRules, toggleVehicleVip } = useVipRules()
  const [selectedVehicle, setSelectedVehicle] = React.useState<ClientVehicleTableRow | null>(null)

  const canManageClients = canManageOperationalData(auth)
  const tableData = React.useMemo<ClientVehicleTableRow[]>(() => {
    return data.map((vehicle) => mapClientVehicleToTableRow(vehicle, {
      isVipEnabled: getVehicleVipStatus(vehicle, vipRules),
    }))
  }, [data, vipRules])

  const columns = React.useMemo(
    () => createClientVehiclesColumns({
      onOpenDetails: setSelectedVehicle,
      onToggleVip: canManageClients
        ? (vehicle) => {
          void notify.promise(
            toggleVehicleVip({
              clientId: vehicle.cod_pessoa,
              clientName: vehicle.nom_pessoa,
              enabled: vehicle.vip !== "sim",
              vehicleId: vehicle.cod_veiculo,
              vehiclePlate: vehicle.num_placa,
            }),
            clientsCopy.feedback.vehicleVip
          )
        }
        : undefined,
      vipActionLabel: clientsCopy.actions.toggleVehicleVip,
    }),
    [canManageClients, toggleVehicleVip]
  )
  const plateOptions = React.useMemo(
    () => createVehiclePlateFilterOptions(tableData),
    [tableData]
  )
  const vipOptions = React.useMemo(
    () => createVehicleVipFilterOptions(tableData),
    [tableData]
  )

  return (
    <PageSection>
      <PageHeader
        title={client?.nom_pessoa ? normalizeDisplayName(client.nom_pessoa) : clientsCopy.pages.clientVehicles.fallbackTitle}
        subtitle={client?.num_cnpj_cpf || clientsCopy.pages.clientVehicles.fallbackDescription}
        actions={(
          <PageHeaderActions>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                void navigate("/clientes")
              }}
            >
              <ArrowLeftIcon aria-hidden="true" />
              {clientsCopy.actions.backToClients}
            </Button>
          </PageHeaderActions>
        )}
      />

      <DataTable
        columns={columns}
        data={tableData}
        columnVisibilityStorageKey={CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(vehicle) => String(vehicle.cod_veiculo)}
        globalSearch={{
          columnIds: ["cod_veiculo", "nom_pessoa", "num_cnpj_cpf", "num_placa", "des_veiculo", "nom_motorista"],
          placeholder: clientsCopy.pages.clientVehicles.searchPlaceholder,
        }}
        filterFields={[
          { id: "num_placa", title: clientsCopy.filters.plates, options: plateOptions },
          { id: "vip", title: clientsCopy.filters.vip, options: vipOptions },
        ]}
        emptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={clientsCopy.empty.vehiclesTitle}
            description={clientsCopy.empty.vehiclesDescription}
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={clientsCopy.filteredEmpty.vehiclesTitle}
            description={clientsCopy.filteredEmpty.vehiclesDescription}
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
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
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
