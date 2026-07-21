import { ArrowLeftIcon, UsersIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { type UserRecord } from "@/features/users"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY } from "../constants/units-persistence"
import { unitsRoutePaths } from "../constants/units-routes"
import {
  useUnitUsers,
  useUnitUsersTableFilters,
  useUnits,
} from "../hooks"
import {
  getUnitUserDetailItems,
  parseUnitRouteId,
} from "../model"
import { createUnitUsersColumns } from "../table"

export function UnitUsersRoute() {
  const navigate = useNavigate()
  const params = useParams<{ cod_empresa: string }>()
  const parsedUnitId = React.useMemo(() => parseUnitRouteId(params.cod_empresa), [params.cod_empresa])
  const unitId = parsedUnitId ? String(parsedUnitId) : ""
  const {
    data: units,
    error: unitsError,
    isLoading: isLoadingUnits,
    refetch: refetchUnits,
  } = useUnits()
  const unit = React.useMemo(
    () => units.find((item) => String(item.cod_empresa) === unitId) ?? null,
    [unitId, units]
  )
  const shouldLoadUsers = Boolean(unit)
  const {
    data: users,
    error: usersError,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useUnitUsers(unitId, { enabled: shouldLoadUsers })
  const [selectedUser, setSelectedUser] = React.useState<UserRecord | null>(null)
  const filterFields = useUnitUsersTableFilters(users)
  const columns = React.useMemo(() => createUnitUsersColumns({ onOpenDetails: setSelectedUser }), [])
  const isResolvingUnit = Boolean(unitId) && isLoadingUnits && !unit
  const isUnitUnavailable = !isResolvingUnit && !unit
  const pageTitle = unit?.nom_fantasia
    ?? (isResolvingUnit ? unitsCopy.pages.units.title : unitsCopy.pages.unitUsers.fallbackTitle)
  const pageSubtitle = unit?.nom_razao_social
    ?? (isResolvingUnit ? unitsCopy.pages.units.subtitle : unitsCopy.pages.unitUsers.fallbackDescription)
  const tableError = unitsError ?? usersError
  const tableUsers = unit ? users : []

  const handleRetry = React.useCallback(async () => {
    await Promise.allSettled([
      refetchUnits(),
      shouldLoadUsers ? refetchUsers() : Promise.resolve([]),
    ])
  }, [refetchUnits, refetchUsers, shouldLoadUsers])

  return (
    <PageSection>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={(
          <PageHeaderActions>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                void navigate(unitsRoutePaths.list)
              }}
            >
              <ArrowLeftIcon aria-hidden="true" />
              {unitsCopy.actions.backToUnits}
            </Button>
          </PageHeaderActions>
        )}
      />

      <DataTable
        columns={columns}
        data={tableUsers}
        columnVisibilityStorageKey={UNIT_USERS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(user: UserRecord) => user.id}
        globalSearch={{
          columnIds: ["name", "cpf", "email", "phoneMasked", "role", "status"],
          placeholder: unitsCopy.pages.unitUsers.searchPlaceholder,
        }}
        filterFields={filterFields}
        emptyState={(
          <AppEmptyState
            media={<UsersIcon />}
            title={isUnitUnavailable ? unitsCopy.pages.unitUsers.fallbackTitle : unitsCopy.empty.unitUsersTitle}
            description={
              isUnitUnavailable
                ? unitsCopy.pages.unitUsers.fallbackDescription
                : unitsCopy.empty.unitUsersDescription
            }
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<UsersIcon />}
            title={unitsCopy.filteredEmpty.unitUsersTitle}
            description={unitsCopy.filteredEmpty.unitUsersDescription}
          />
        )}
        isLoading={isLoadingUnits || (shouldLoadUsers && isLoadingUsers)}
        error={tableError}
        onRetry={() => {
          void handleRetry()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedUser)}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedUser(null)
          }
        }}
        title={selectedUser?.name}
        description={selectedUser?.email ?? unitsCopy.table.noEmail}
        items={selectedUser ? getUnitUserDetailItems(selectedUser) : []}
      />
    </PageSection>
  )
}
