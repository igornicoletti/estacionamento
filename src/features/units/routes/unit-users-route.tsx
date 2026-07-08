import { ArrowLeftIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { Button } from "@/components/ui/button"
import {
  appUserStatusLabels,
  userRoleLabels,
} from "@/features/auth"

import { createUnitUsersColumns } from "../columns/unit-users-columns"
import { useUnitUsers } from "../hooks/use-unit-users"
import { unitsCopy } from "../units-copy"
import { parseUnitRouteId } from "../utils/units-models"

const UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.unit-users.columns.v1"

export function UnitUsersRoute() {
  const navigate = useNavigate()
  const { cod_empresa: codEmpresaParam } = useParams<{ cod_empresa: string }>()
  const unitId = React.useMemo(
    () => parseUnitRouteId(codEmpresaParam),
    [codEmpresaParam]
  )
  const { unit, data, error, isLoading, refetch } = useUnitUsers(unitId)
  const columns = React.useMemo(() => createUnitUsersColumns(), [])
  const roleOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (user) => user.role,
        (user) => userRoleLabels[user.role]
      ),
    [data]
  )
  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (user) => user.status,
        (user) => appUserStatusLabels[user.status]
      ),
    [data]
  )

  return (
    <PageSection>
      <PageHeader
        headingContent={(
          <>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Voltar para unidades"
                onClick={() => {
                  void navigate("/unidades")
                }}
              >
                <ArrowLeftIcon aria-hidden="true" />
              </Button>
              <h1 className="text-2xl font-semibold">
                {unit?.nom_fantasia || unitsCopy.pages.unitUsers.fallbackTitle}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {unit?.num_cnpj || ""}
            </p>
          </>
        )}
      />

      <DataTable
        columns={columns}
        data={data}
        columnVisibilityStorageKey={UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(user) => user.id}
        globalSearch={{
          columnIds: [
            "id",
            "name",
            "cpf",
            "email",
            "phoneMasked",
            "role",
            "status",
            "passkeyStatus",
            "lastAccessAt",
          ],
          placeholder: unitsCopy.pages.unitUsers.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "role",
            title: unitsCopy.filters.roles,
            options: roleOptions,
          },
          {
            id: "status",
            title: unitsCopy.filters.status,
            options: statusOptions,
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
    </PageSection>
  )
}
