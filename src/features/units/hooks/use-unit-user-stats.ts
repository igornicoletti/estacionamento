import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import {
  UNIT_USER_STATS_CACHE_KEY,
  UNIT_USER_STATS_DISABLED_CACHE_KEY,
} from "../constants/units-persistence"
import { type UnitUserStats } from "../model/units-types"
import { listUnitUserStats } from "../services/unit-user-stats-service"

const emptyStats = new Map<string, UnitUserStats>()

export function useUnitUserStats({ enabled }: { enabled: boolean }) {
  const loadData = React.useCallback(() => {
    return enabled ? listUnitUserStats() : Promise.resolve(emptyStats)
  }, [enabled])

  return useAsyncSnapshot<Map<string, UnitUserStats>>({
    cacheKey: enabled
      ? UNIT_USER_STATS_CACHE_KEY
      : UNIT_USER_STATS_DISABLED_CACHE_KEY,
    errorMessage: unitsCopy.errors.unitUsersLoad,
    initialData: emptyStats,
    loadData,
  })
}
