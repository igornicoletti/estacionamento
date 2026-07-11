import { DatabaseIcon } from "lucide-react"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppSheet } from "@/components/shared/app-sheet"

import { createPermissionsColumns } from "../columns/permissions-columns"
import { permissionsCopy } from "../content/permissions-copy"
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
import { formatPermissionRolesWithoutAccess } from "../utils/permissions-model"

const PERMISSIONS_TABLE_STATE_KEY = "rmc.table.permissions.v2"

export function PermissionsRoute() {
  const { data: permissions, error, isLoading, refetch } = usePermissions()
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
      permissionRoleValues.map((role) => ({
        label: permissionRoleLabels[role],
        value: role,
      })),
    []
  )
  const accessOptions = React.useMemo(
    () =>
      permissionAccessFilterValues.map((access) => ({
        label: permissionAccessFilterLabels[access],
        value: access,
      })),
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
        tableStateStorageKey={PERMISSIONS_TABLE_STATE_KEY}
        defaultColumnVisibility={{
          accessFilters: false,
          roles: false,
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
            maxVisibleChips: 1,
            options: roleOptions,
            title: permissionsCopy.filters.roles,
          },
          {
            id: "accessFilters",
            maxVisibleChips: 1,
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

      <AppSheet
        open={Boolean(selectedPermission)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPermission(null)
          }
        }}
        title={selectedPermission?.label}
        description={selectedPermission?.description ?? selectedPermission?.key}
      >
        {selectedPermission ? (
          <dl className="grid gap-4 py-4 text-sm">
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">{permissionsCopy.labels.key}</dt>
              <dd className="break-all font-mono text-xs">{selectedPermission.key}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">{permissionsCopy.labels.group}</dt>
              <dd>{selectedPermission.groupLabel}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">{permissionsCopy.labels.source}</dt>
              <dd>{permissionSourceLabels[selectedPermission.source]}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">{permissionsCopy.labels.critical}</dt>
              <dd>{selectedPermission.isCritical ? permissionsCopy.labels.yes : permissionsCopy.labels.no}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">{permissionsCopy.labels.rolesWithAccess}</dt>
              <dd>{selectedPermission.roleLabels}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">{permissionsCopy.labels.rolesWithoutAccess}</dt>
              <dd>{formatPermissionRolesWithoutAccess(selectedPermission.roles)}</dd>
            </div>
          </dl>
        ) : null}
      </AppSheet>
    </PageSection>
  )
}
