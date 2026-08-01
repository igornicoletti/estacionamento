import * as React from "react"
import { useNavigate } from "react-router"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"
import { SyncOperations } from "@/features/sync"

import { UnitsTable } from "../components/units-table"
import { unitsCopy } from "../constants/units-copy"
import { unitsRoutePaths } from "../constants/units-routes"
import { useUnitTableRows } from "../hooks/use-unit-table-rows"
import { getUnitDetailItems } from "../model/units-details"
import { type UnitTableRow } from "../model/units-table-model"

export function UnitsRoute() {
  const auth = useAuth()
  const navigate = useNavigate()
  const canReadUsers = auth.access.hasPermission(
    AUTH_PERMISSION.usersRead
  )
  const { data, error, isLoading, refetch } = useUnitTableRows({
    includeUserStats: canReadUsers,
  })
  const [selectedUnit, setSelectedUnit] =
    React.useState<UnitTableRow | null>(null)
  const openUnitDetails = React.useCallback((unit: UnitTableRow) => {
    setSelectedUnit(unit)
  }, [])
  const openUnitUsers = React.useCallback(
    (unit: UnitTableRow) => {
      void navigate(unitsRoutePaths.users(unit.cod_empresa))
    },
    [navigate]
  )

  return (
    <AppPage
      title={unitsCopy.pages.units.title}
      subtitle={unitsCopy.pages.units.subtitle}
      actions={(
        <SyncOperations resource="units" onSynchronized={refetch} />
      )}
    >
      <UnitsTable
        data={data}
        error={error}
        isLoading={isLoading}
        onOpenDetails={openUnitDetails}
        onRetry={() => {
          void refetch()
        }}
        onSelectUsers={canReadUsers ? openUnitUsers : undefined}
        showUserStats={canReadUsers}
      />

      <AppDetailsSheet
        open={Boolean(selectedUnit)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUnit(null)
          }
        }}
        title={selectedUnit ? unitsCopy.details.unitTitle : undefined}
        description={
          selectedUnit ? unitsCopy.details.unitDescription : undefined
        }
        items={
          selectedUnit
            ? getUnitDetailItems(selectedUnit, {
                userStats: selectedUnit.userStats,
                yardConfig: selectedUnit.yardConfig,
              })
            : []
        }
      />
    </AppPage>
  )
}
