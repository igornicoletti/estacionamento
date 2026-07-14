import { DatabaseIcon } from "lucide-react"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"

import { createPermissionsColumns } from "../columns/permissions-columns"
import { permissionsCopy } from "../permissions-copy"
import { usePermissions } from "../hooks/use-permissions"
import {
  permissionAccessFilterLabels,
  permissionAccessFilterValues,
  permissionRoleLabels,
  permissionRoleValues,
  permissionSourceLabels,
  permissionSourceValues,
  type PermissionMatrixRow,
} from "../types/permissions-types"
import { getPermissionDetailItems } from "../utils/permissions-details-model"

const PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.permissions.columns.v2"

export function PermissionsRoute() {
  const permissionsSnapshot = usePermissions()
  const permissions = permissionsSnapshot.data
  const error = permissionsSnapshot.error
  const isLoading = permissionsSnapshot.isLoading
  const refetch = permissionsSnapshot.refetch
  const [selectedPermission, setSelectedPermission] = React.useState<PermissionMatrixRow | null>(null)
  const columns = React.useMemo(
    () => createPermissionsColumns({ onOpenDetails: setSelectedPermission }),
    []
  )

  const groupOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        permissions,
        (permission) => permission.groupLabel,
        (permission) => permission.groupLabel
      ),
    [permissions]
  )
  const sourceOptions = React.useMemo(
    () =>
      permissionSourceValues.map((source) => ({
        label: permissionSourceLabels[source],
        value: source,
      })),
    []
  )
  const roleOptions = React.useMemo(
    () =>
      permissionRoleValues.map((role) => {
        const count = permissions.filter((permission) =>
          permission.roles.includes(role)
        ).length

        return {
          count,
          label: permissionRoleLabels[role],
          value: role,
        }
      }),
    [permissions]
  )
  const accessOptions = React.useMemo(
    () =>
      permissionAccessFilterValues.map((access) => {
        const count = permissions.filter((permission) =>
          permission.accessFilters.includes(access)
        ).length

        return {
          count,
          label: permissionAccessFilterLabels[access],
          value: access,
        }
      }),
    [permissions]
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
        defaultColumnVisibility={{
          accessFilters: false,
          groupLabel: false,
          roleCount: false,
          roles: false,
          source: false,
        }}
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
          {
            id: "roles",
            options: roleOptions,
            title: permissionsCopy.filters.roles,
          },
          {
            id: "accessFilters",
            options: accessOptions,
            title: permissionsCopy.filters.access,
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
        title={selectedPermission?.label}
        description={selectedPermission?.description ?? selectedPermission?.key}
        items={selectedPermission ? getPermissionDetailItems(selectedPermission) : []}
      />
    </PageSection>
  )
}
