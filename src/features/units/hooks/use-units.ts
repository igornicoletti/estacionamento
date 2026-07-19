import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { UNITS_CACHE_KEY, unitsCopy } from "../constants"
import { listUnits } from "../services"
import { type Unit } from "../model"

export function useUnits() {
  return useAsyncSnapshot<Unit[]>({
    cacheKey: UNITS_CACHE_KEY,
    errorMessage: unitsCopy.errors.unitsLoad,
    initialData: [],
    loadData: listUnits,
  })
}
