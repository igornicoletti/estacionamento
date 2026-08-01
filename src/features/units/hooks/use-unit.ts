import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_DETAIL_CACHE_KEY_PREFIX } from "../constants/units-persistence"
import { type Unit } from "../model/units-types"
import { findUnitById } from "../services/units-service"

export function useUnit(unitId: number) {
  const loadData = React.useCallback(
    () => findUnitById(unitId),
    [unitId]
  )

  return useAsyncSnapshot<Unit | null>({
    cacheKey: `${UNIT_DETAIL_CACHE_KEY_PREFIX}:${unitId}`,
    errorMessage: unitsCopy.errors.unitsLoad,
    initialData: null,
    loadData,
  })
}
