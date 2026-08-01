import { KeyRoundIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"

import { permissionsCopy } from "../constants/permissions-copy"
import {
  PERMISSIONS_DEFAULT_COLUMN_VISIBILITY,
  PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY,
} from "../constants/permissions-persistence"
import { toPermissionTableRows } from "../model/permissions-models"
import {
  type PermissionMatrix,
  type PermissionTableRow,
} from "../model/permissions-types"
import { createPermissionsColumns } from "../table/permissions-columns"
import { createPermissionsFilterFields } from "../table/permissions-filter-options"

interface PermissionsTableProps {
  error: Error | null
  isLoading: boolean
  matrix: PermissionMatrix
  onOpenDetails: (permission: PermissionTableRow) => void
  onRetry: () => void
}

export function PermissionsTable({
  error,
  isLoading,
  matrix,
  onOpenDetails,
  onRetry,
}: PermissionsTableProps) {
  const data = React.useMemo(
    () => toPermissionTableRows(matrix.permissions),
    [matrix.permissions]
  )
  const columns = React.useMemo(
    () => createPermissionsColumns({ onOpenDetails, roles: matrix.roles }),
    [matrix.roles, onOpenDetails]
  )
  const filterFields = React.useMemo(
    () => createPermissionsFilterFields(data),
    [data]
  )

  return (
    <DataTable
      ariaLabel={permissionsCopy.table.ariaLabel}
      columns={columns}
      data={data}
      defaultColumnVisibility={PERMISSIONS_DEFAULT_COLUMN_VISIBILITY}
      columnVisibilityStorageKey={PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY}
      getRowId={(permission) => permission.key}
      globalSearch={{
        columnIds: ["key", "label", "groupLabel"],
        placeholder: permissionsCopy.table.searchPlaceholder,
      }}
      filterFields={filterFields}
      emptyState={(
        <AppEmptyState
          media={<KeyRoundIcon aria-hidden="true" />}
          title={permissionsCopy.empty.title}
          description={permissionsCopy.empty.description}
        />
      )}
      filteredEmptyState={(
        <AppEmptyState
          media={<KeyRoundIcon aria-hidden="true" />}
          title={permissionsCopy.filteredEmpty.title}
          description={permissionsCopy.filteredEmpty.description}
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
