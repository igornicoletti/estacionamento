import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import {
  UNIT_USER_STATS_CACHE_KEY,
  UNIT_USER_STATS_DISABLED_CACHE_KEY,
} from "../constants/units-persistence"
import { type UnitUserStats } from "../model"
import { listUnitUserStats } from "../services"

function resolveEmptyUnitUserStats() {
  return Promise.resolve(new Map<string, UnitUserStats>())
}

export function useUnitUserStats(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true

  return useAsyncSnapshot<Map<string, UnitUserStats>>({
    cacheKey: enabled ? UNIT_USER_STATS_CACHE_KEY : UNIT_USER_STATS_DISABLED_CACHE_KEY,
    errorMessage: unitsCopy.errors.unitUsersLoad,
    initialData: new Map(),
    loadData: enabled ? listUnitUserStats : resolveEmptyUnitUserStats,
  })
}
