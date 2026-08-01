import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppPage } from "@/components/shared/app-page"
import { Button } from "@/components/ui/button"
import { type UserRecord } from "@/features/users"

import { UnitUsersTable } from "../components/unit-users-table"
import { unitsCopy } from "../constants/units-copy"
import { unitsRoutePaths } from "../constants/units-routes"
import { useUnit } from "../hooks/use-unit"
import { useUnitUsers } from "../hooks/use-unit-users"
import { getUnitUserDetailItems } from "../model/units-details"
import { parseUnitRouteId } from "../model/units-formatting"

export function UnitUsersRoute() {
  const { cod_empresa: unitIdParam } = useParams<{
    cod_empresa: string
  }>()
  const unitId = parseUnitRouteId(unitIdParam)

  if (unitId === null) {
    return <InvalidUnitRoute />
  }

  return <ResolvedUnitUsersRoute unitId={unitId} />
}

function InvalidUnitRoute() {
  const navigate = useNavigate()

  return (
    <AppPage
      title={unitsCopy.pages.unitUsers.fallbackTitle}
      subtitle={unitsCopy.pages.unitUsers.fallbackDescription}
    >
      <AppEmptyState
        media={<TriangleAlertIcon aria-hidden="true" />}
        title={unitsCopy.pages.unitUsers.fallbackTitle}
        description={unitsCopy.pages.unitUsers.fallbackDescription}
        actions={(
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigate(unitsRoutePaths.list)
            }}
          >
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            {unitsCopy.actions.backToUnits}
          </Button>
        )}
      />
    </AppPage>
  )
}

function ResolvedUnitUsersRoute({ unitId }: { unitId: number }) {
  const navigate = useNavigate()
  const {
    data: unit,
    error: unitError,
    isLoading: isUnitLoading,
    refetch: refetchUnit,
  } = useUnit(unitId)
  const {
    data: users,
    error: usersError,
    isLoading: areUsersLoading,
    refetch: refetchUsers,
  } = useUnitUsers(String(unitId), {
    enabled: Boolean(unit),
  })
  const [selectedUser, setSelectedUser] =
    React.useState<UserRecord | null>(null)
  const openUserDetails = React.useCallback((user: UserRecord) => {
    setSelectedUser(user)
  }, [])
  const isUnitUnavailable = !isUnitLoading && !unitError && !unit
  const pageTitle =
    unit?.nom_fantasia ??
    (isUnitLoading
      ? unitsCopy.pages.units.title
      : unitsCopy.pages.unitUsers.fallbackTitle)
  const pageSubtitle =
    unit?.nom_razao_social ??
    (isUnitLoading
      ? unitsCopy.pages.units.subtitle
      : unitsCopy.pages.unitUsers.fallbackDescription)
  const refetch = React.useCallback(async () => {
    await refetchUnit()

    if (unit) {
      await refetchUsers()
    }
  }, [refetchUnit, refetchUsers, unit])

  return (
    <AppPage
      title={pageTitle}
      subtitle={pageSubtitle}
      actions={(
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void navigate(unitsRoutePaths.list)
          }}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          {unitsCopy.actions.backToUnits}
        </Button>
      )}
    >
      <UnitUsersTable
        data={unit ? users : []}
        error={unitError ?? usersError}
        isLoading={
          isUnitLoading ||
          (Boolean(unit) && areUsersLoading)
        }
        isUnitUnavailable={isUnitUnavailable}
        onOpenDetails={openUserDetails}
        onRetry={() => {
          void refetch()
        }}
      />

      <AppDetailsSheet
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null)
          }
        }}
        title={selectedUser ? unitsCopy.details.userTitle : undefined}
        description={
          selectedUser ? unitsCopy.details.userDescription : undefined
        }
        items={
          selectedUser ? getUnitUserDetailItems(selectedUser) : []
        }
      />
    </AppPage>
  )
}
