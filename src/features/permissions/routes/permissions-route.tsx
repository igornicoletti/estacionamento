import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"

import { createPermissionsColumns } from "../columns/permissions-columns"
import { usePermissions } from "../hooks/use-permissions"
import { permissionsCopy } from "../permissions-copy"

const PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.permissions.columns.v1"

export function PermissionsRoute() {
  const { data: permissions, error, isLoading, refetch } = usePermissions()
  const columns = React.useMemo(() => createPermissionsColumns(), [])

  const groupOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        permissions,
        (permission) => permission.groupLabel,
        (permission) => permission.groupLabel
      ),
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
        getRowId={(permission) => permission.capability}
        globalSearch={{
          columnIds: ["label", "groupLabel"],
          placeholder: permissionsCopy.filters.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "groupLabel",
            title: permissionsCopy.filters.groups,
            options: groupOptions,
          },
        ]}
        isLoading={isLoading}
        error={error}
        emptyState={(
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{permissionsCopy.empty.title}</p>
            <p>{permissionsCopy.empty.description}</p>
          </div>
        )}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />
    </PageSection>
  )
}
