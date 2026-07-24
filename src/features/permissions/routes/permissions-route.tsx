import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"

import { createPermissionsColumns } from "../columns/permissions-columns"
import { usePermissions } from "../hooks/use-permissions"

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
    <div className="flex flex-col gap-6">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          Perfil e Permissões
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consulte a matriz de perfis e as permissões concedidas a cada nível de
          acesso do sistema.
        </p>
      </header>

      <DataTable
        columns={columns}
        data={permissions}
        getRowId={(permission) => permission.capability}
        globalSearch={{
          columnIds: ["capability", "label", "groupLabel"],
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
    </div>
  )
}
