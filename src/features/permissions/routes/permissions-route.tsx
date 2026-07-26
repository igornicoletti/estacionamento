import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"

import { createPermissionsColumns } from "../table"
import { usePermissions } from "../hooks/use-permissions"
import {
  getPermissionDetailItems,
  type PermissionMatrixRow,
} from "../model"

export function PermissionsRoute() {
  const { data: permissions, error, isLoading, refetch } = usePermissions()
  const [selectedPermission, setSelectedPermission] =
    React.useState<PermissionMatrixRow | null>(null)
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

  return (
    <AppPage
      title="Perfil e Permissões"
      subtitle="Consulte a matriz de perfis e as permissões concedidas a cada nível de acesso do sistema."
      headingClassName="max-w-2xl"
    >
      <DataTable
        columns={columns}
        data={permissions}
        getRowId={(permission) => permission.key}
        globalSearch={{
          columnIds: ["key", "label", "groupLabel"],
          placeholder: "Buscar permissões...",
        }}
        filterFields={[
          {
            id: "groupLabel",
            title: "Grupos",
            options: groupOptions,
          },
        ]}
        isLoading={isLoading}
        error={error}
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
        title={selectedPermission ? "Detalhes da permissão" : undefined}
        description={
          selectedPermission
            ? "Consulte a classificação e os perfis com acesso à permissão selecionada."
            : undefined
        }
        items={
          selectedPermission ? getPermissionDetailItems(selectedPermission) : []
        }
      />
    </AppPage>
  )
}
