import * as React from "react"

import { createUnitTableRows } from "../model/units-table-model"
import { useUnits } from "./use-units"
import { useUnitUserStats } from "./use-unit-user-stats"
import { useUnitYardConfigs } from "./use-unit-yard-configs"

export function useUnitTableRows({
  includeUserStats,
}: {
  includeUserStats: boolean
}) {
  const {
    data: units,
    error: unitsError,
    isLoading: areUnitsLoading,
    refetch: refetchUnits,
  } = useUnits()
  const {
    data: yardConfigs,
    error: yardConfigsError,
    isLoading: areYardConfigsLoading,
    refetch: refetchYardConfigs,
  } = useUnitYardConfigs()
  const {
    data: userStats,
    error: userStatsError,
    isLoading: areUserStatsLoading,
    refetch: refetchUserStats,
  } = useUnitUserStats({ enabled: includeUserStats })
  const data = React.useMemo(
    () =>
      createUnitTableRows({
        units,
        yardConfigs,
        userStats: includeUserStats ? userStats : null,
      }),
    [
      includeUserStats,
      units,
      userStats,
      yardConfigs,
    ]
  )
  const refetch = React.useCallback(async () => {
    await Promise.all([
      refetchUnits(),
      refetchYardConfigs(),
      includeUserStats ? refetchUserStats() : Promise.resolve(),
    ])
  }, [
    includeUserStats,
    refetchUnits,
    refetchUserStats,
    refetchYardConfigs,
  ])

  return {
    data,
    error:
      unitsError ??
      yardConfigsError ??
      (includeUserStats ? userStatsError : null),
    isLoading:
      areUnitsLoading ||
      areYardConfigsLoading ||
      (includeUserStats && areUserStatsLoading),
    refetch,
  }
}
