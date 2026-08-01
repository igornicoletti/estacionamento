import { CarFrontIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"

import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY,
  DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY,
} from "../constants/clients-persistence"
import { useClientVehiclesTableFilters } from "../hooks/use-client-vehicles-table-filters"
import { type ClientVehicleTableRow } from "../model/clients-types"
import { createClientVehiclesColumns } from "../table/client-vehicles-columns"

interface ClientVehiclesTableProps {
  data: ClientVehicleTableRow[]
  error: Error | null
  isClientUnavailable: boolean
  isLoading: boolean
  onOpenDetails: (vehicle: ClientVehicleTableRow) => void
  onRetry: () => void
}

export function ClientVehiclesTable({
  data,
  error,
  isClientUnavailable,
  isLoading,
  onOpenDetails,
  onRetry,
}: ClientVehiclesTableProps) {
  const columns = React.useMemo(
    () => createClientVehiclesColumns({ onOpenDetails }),
    [onOpenDetails]
  )
  const filterFields = useClientVehiclesTableFilters(data)

  return (
    <DataTable
      ariaLabel={clientsCopy.pages.clientVehicles.tableAriaLabel}
      columns={columns}
      data={data}
      defaultColumnVisibility={DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY}
      columnVisibilityStorageKey={CLIENT_VEHICLES_TABLE_COLUMN_VISIBILITY_KEY}
      getRowId={(vehicle) =>
        `${vehicle.cod_pessoa}:${vehicle.cod_veiculo}:${vehicle.num_placa}`
      }
      globalSearch={{
        columnIds: [
          "cod_veiculo",
          "nom_pessoa",
          "nom_fantasia",
          "num_cnpj_cpf",
          "num_placa",
          "des_veiculo",
          "nom_motorista",
        ],
        placeholder: clientsCopy.pages.clientVehicles.searchPlaceholder,
      }}
      filterFields={filterFields}
      emptyState={(
        <AppEmptyState
          media={<CarFrontIcon aria-hidden="true" />}
          title={
            isClientUnavailable
              ? clientsCopy.pages.clientVehicles.fallbackTitle
              : clientsCopy.empty.vehiclesTitle
          }
          description={
            isClientUnavailable
              ? clientsCopy.pages.clientVehicles.fallbackDescription
              : clientsCopy.empty.vehiclesDescription
          }
        />
      )}
      filteredEmptyState={(
        <AppEmptyState
          media={<CarFrontIcon aria-hidden="true" />}
          title={clientsCopy.filteredEmpty.vehiclesTitle}
          description={clientsCopy.filteredEmpty.vehiclesDescription}
        />
      )}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      enablePagination
      enableViewOptions
    />
  )
}
