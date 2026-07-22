import { DatabaseIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"

import {
  PERMISSIONS_DEFAULT_COLUMN_VISIBILITY,
  PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY,
  permissionsCopy,
} from "../constants"
import { usePermissions, usePermissionsTableFilters } from "../hooks"
import { getPermissionDetailItems, type PermissionMatrixRow } from "../model"
import { createPermissionsColumns } from "../table"

export function PermissionsRoute() {
  const permissionsSnapshot = usePermissions()
  const permissions = permissionsSnapshot.data
  const error = permissionsSnapshot.error
  const isLoading = permissionsSnapshot.isLoading
  const refetch = permissionsSnapshot.refetch
  const { groupOptions, sourceOptions } = usePermissionsTableFilters(permissions)
  const [selectedPermission, setSelectedPermission] =
    React.useState<PermissionMatrixRow | null>(null)
  const columns = React.useMemo(
    () => createPermissionsColumns({ onOpenDetails: setSelectedPermission }),
    []
  )

  return (
    <PageSection>
      <PageHeader
        title={permissionsCopy.page.title}
        subtitle={permissionsCopy.page.subtitle}
      />

      <DataTable
        columns={columns}
        data={permissions}
        columnVisibilityStorageKey={PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY}
        defaultColumnVisibility={PERMISSIONS_DEFAULT_COLUMN_VISIBILITY}
        getRowId={(permission) => permission.id}
        globalSearch={{
          columnIds: ["label", "key", "groupLabel"],
          placeholder: permissionsCopy.filters.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "groupLabel",
            options: groupOptions,
            title: permissionsCopy.filters.groups,
          },
          {
            id: "source",
            options: sourceOptions,
            title: permissionsCopy.filters.source,
          },
        ]}
        isLoading={isLoading}
        error={error}
        emptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={permissionsCopy.empty.title}
            description={permissionsCopy.empty.description}
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={permissionsCopy.filteredEmpty.title}
            description={permissionsCopy.filteredEmpty.description}
          />
        )}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedPermission)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPermission(null)
          }
        }}
        title={selectedPermission ? permissionsCopy.details.title : undefined}
        description={
          selectedPermission
            ? permissionsCopy.details.description
            : undefined
        }
        items={selectedPermission ? getPermissionDetailItems(selectedPermission) : []}
      />
    </PageSection>
  )
}
