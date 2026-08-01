import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import { UNITS_CACHE_KEY } from "../constants/units-persistence"
import { type Unit } from "../model/units-types"
import { listUnits } from "../services/units-service"

export function useUnits() {
  const loadData = React.useCallback(() => listUnits(), [])

  return useAsyncSnapshot<Unit[]>({
    cacheKey: UNITS_CACHE_KEY,
    errorMessage: unitsCopy.errors.unitsLoad,
    initialData: [],
    loadData,
  })
}
