import { ArrowLeftIcon, UsersIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { createDataTableFilterOptions, DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { appUserStatusLabels, userRoleLabels, type UserRecord } from "@/features/users/types/users-types"

import { createUnitUsersColumns } from "../columns/unit-users-columns"
import { useUnitUsers } from "../hooks/use-unit-users"
import { useUnits } from "../hooks/use-units"
import { unitsCopy } from "../units-copy"
import { getUnitUserDetailItems } from "../utils/units-details-model"
import { parseUnitRouteId } from "../utils/units-models"

const unitUsersTableColumnVisibilityKey = "rmc.units.users.table-column-visibility.v2"

export function UnitUsersRoute() {
  const navigate = useNavigate()
  const params = useParams<{ cod_empresa: string }>()
  const parsedUnitId = React.useMemo(() => parseUnitRouteId(params.cod_empresa), [params.cod_empresa])
  const unitId = parsedUnitId ? String(parsedUnitId) : ""
  const { data: units } = useUnits()
  const { data: users, error, isLoading, refetch } = useUnitUsers(unitId)
  const [selectedUser, setSelectedUser] = React.useState<UserRecord | null>(null)

  const unit = React.useMemo(() => {
    return units.find((item) => String(item.cod_empresa) === unitId) ?? null
  }, [unitId, units])

  const columns = React.useMemo(() => createUnitUsersColumns({ onOpenDetails: setSelectedUser }), [])
  const roleOptions = React.useMemo(
    () => createDataTableFilterOptions(users, (user) => user.role, (user) => userRoleLabels[user.role]),
    [users]
  )
  const statusOptions = React.useMemo(
    () => createDataTableFilterOptions(users, (user) => user.status, (user) => appUserStatusLabels[user.status]),
    [users]
  )

  return (
    <PageSection>
      <PageHeader
        title={unit?.nom_fantasia ?? unitsCopy.pages.unitUsers.fallbackTitle}
        subtitle={unit?.nom_razao_social ?? unitsCopy.pages.unitUsers.fallbackDescription}
        actions={(
          <PageHeaderActions>
            <Button type="button" variant="secondary" size="lg" onClick={() => { void navigate("/unidades") }}>
              <ArrowLeftIcon aria-hidden="true" />
              {unitsCopy.actions.backToUnits}
            </Button>
          </PageHeaderActions>
        )}
      />

      <DataTable
        columns={columns}
        data={users}
        columnVisibilityStorageKey={unitUsersTableColumnVisibilityKey}
        getRowId={(user) => user.id}
        globalSearch={{
          columnIds: ["name", "cpf", "email", "phoneMasked", "role", "status"],
          placeholder: unitsCopy.pages.unitUsers.searchPlaceholder,
        }}
        filterFields={[
          { id: "role", title: unitsCopy.filters.roles, options: roleOptions },
          { id: "status", title: unitsCopy.filters.status, options: statusOptions },
        ]}
        emptyState={<AppEmptyState media={<UsersIcon />} title={unitsCopy.empty.unitUsersTitle} description={unitsCopy.empty.unitUsersDescription} />}
        filteredEmptyState={<AppEmptyState media={<UsersIcon />} title={unitsCopy.filteredEmpty.unitUsersTitle} description={unitsCopy.filteredEmpty.unitUsersDescription} />}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch() }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedUser)}
        onOpenChange={(open) => { if (!open) setSelectedUser(null) }}
        title={selectedUser?.name}
        description={selectedUser?.email ?? unitsCopy.table.noEmail}
        items={selectedUser ? getUnitUserDetailItems(selectedUser) : []}
      />
    </PageSection>
  )
}
