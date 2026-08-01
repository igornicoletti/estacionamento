import { Building2Icon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"

import { unitsCopy } from "../constants/units-copy"
import {
  DEFAULT_UNITS_COLUMN_VISIBILITY,
  UNITS_TABLE_COLUMN_VISIBILITY_KEY,
} from "../constants/units-persistence"
import { useUnitsTableFilters } from "../hooks/use-units-table-filters"
import { type UnitTableRow } from "../model/units-table-model"
import { createUnitsColumns } from "../table/units-columns"

interface UnitsTableProps {
  data: UnitTableRow[]
  error: Error | null
  isLoading: boolean
  onOpenDetails: (unit: UnitTableRow) => void
  onRetry: () => void
  onSelectUsers?: (unit: UnitTableRow) => void
  showUserStats: boolean
}

export function UnitsTable({
  data,
  error,
  isLoading,
  onOpenDetails,
  onRetry,
  onSelectUsers,
  showUserStats,
}: UnitsTableProps) {
  const columns = React.useMemo(
    () =>
      createUnitsColumns({
        onOpenDetails,
        onSelectUsers,
        showUserStats,
      }),
    [onOpenDetails, onSelectUsers, showUserStats]
  )
  const filterFields = useUnitsTableFilters(data)

  return (
    <DataTable
      ariaLabel={unitsCopy.pages.units.tableAriaLabel}
      columns={columns}
      data={data}
      defaultColumnVisibility={DEFAULT_UNITS_COLUMN_VISIBILITY}
      columnVisibilityStorageKey={UNITS_TABLE_COLUMN_VISIBILITY_KEY}
      getRowId={(unit) => String(unit.cod_empresa)}
      globalSearch={{
        columnIds: [
          "cod_empresa",
          "nom_razao_social",
          "nom_fantasia",
          "num_cnpj",
          "des_bandeira",
          "nom_cidade",
          "nom_estado",
          "sgl_estado",
        ],
        placeholder: unitsCopy.pages.units.searchPlaceholder,
      }}
      filterFields={filterFields}
      emptyState={(
        <AppEmptyState
          media={<Building2Icon aria-hidden="true" />}
          title={unitsCopy.empty.unitsTitle}
          description={unitsCopy.empty.unitsDescription}
        />
      )}
      filteredEmptyState={(
        <AppEmptyState
          media={<Building2Icon aria-hidden="true" />}
          title={unitsCopy.filteredEmpty.unitsTitle}
          description={unitsCopy.filteredEmpty.unitsDescription}
        />
      )}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      enableExport
      exportConfig={{ filename: "unidades", sheetName: "Unidades" }}
      enablePagination
      enableViewOptions
    />
  )
}
