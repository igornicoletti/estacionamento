import * as React from "react"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"

import { PermissionsTable } from "../components/permissions-table"
import { permissionsCopy } from "../constants/permissions-copy"
import { usePermissions } from "../hooks/use-permissions"
import { getPermissionDetailItems } from "../model/permissions-details-model"
import { type PermissionTableRow } from "../model/permissions-types"

export function PermissionsRoute() {
  const { data: matrix, error, isLoading, refetch } = usePermissions()
  const [selectedPermission, setSelectedPermission] =
    React.useState<PermissionTableRow | null>(null)

  return (
    <AppPage
      title={permissionsCopy.page.title}
      subtitle={permissionsCopy.page.subtitle}
      headingClassName="max-w-2xl"
    >
      <PermissionsTable
        matrix={matrix}
        isLoading={isLoading}
        error={error}
        onOpenDetails={setSelectedPermission}
        onRetry={() => {
          void refetch()
        }}
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
        items={
          selectedPermission
            ? getPermissionDetailItems(selectedPermission, matrix.roles)
            : []
        }
      />
    </AppPage>
  )
}
