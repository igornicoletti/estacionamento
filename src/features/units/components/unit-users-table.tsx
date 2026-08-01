import { UsersIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { type UserRecord } from "@/features/users"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY } from "../constants/units-persistence"
import { useUnitUsersTableFilters } from "../hooks/use-unit-users-table-filters"
import { createUnitUsersColumns } from "../table/unit-users-columns"

interface UnitUsersTableProps {
  data: UserRecord[]
  error: Error | null
  isLoading: boolean
  isUnitUnavailable: boolean
  onOpenDetails: (user: UserRecord) => void
  onRetry: () => void
}

export function UnitUsersTable({
  data,
  error,
  isLoading,
  isUnitUnavailable,
  onOpenDetails,
  onRetry,
}: UnitUsersTableProps) {
  const columns = React.useMemo(
    () => createUnitUsersColumns({ onOpenDetails }),
    [onOpenDetails]
  )
  const filterFields = useUnitUsersTableFilters(data)

  return (
    <DataTable
      ariaLabel={unitsCopy.pages.unitUsers.tableAriaLabel}
      columns={columns}
      data={data}
      columnVisibilityStorageKey={UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY}
      getRowId={(user) => user.id}
      globalSearch={{
        columnIds: [
          "name",
          "cpf",
          "email",
          "phoneMasked",
          "role",
          "status",
        ],
        placeholder: unitsCopy.pages.unitUsers.searchPlaceholder,
      }}
      filterFields={filterFields}
      emptyState={(
        <AppEmptyState
          media={<UsersIcon aria-hidden="true" />}
          title={
            isUnitUnavailable
              ? unitsCopy.pages.unitUsers.fallbackTitle
              : unitsCopy.empty.unitUsersTitle
          }
          description={
            isUnitUnavailable
              ? unitsCopy.pages.unitUsers.fallbackDescription
              : unitsCopy.empty.unitUsersDescription
          }
        />
      )}
      filteredEmptyState={(
        <AppEmptyState
          media={<UsersIcon aria-hidden="true" />}
          title={unitsCopy.filteredEmpty.unitUsersTitle}
          description={unitsCopy.filteredEmpty.unitUsersDescription}
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
