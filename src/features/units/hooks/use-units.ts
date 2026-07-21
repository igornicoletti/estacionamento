import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import { UNITS_CACHE_KEY } from "../constants/units-persistence"
import { type Unit } from "../model"
import { listUnits } from "../services"

export function useUnits() {
  return useAsyncSnapshot<Unit[]>({
    cacheKey: UNITS_CACHE_KEY,
    errorMessage: unitsCopy.errors.unitsLoad,
    initialData: [],
    loadData: listUnits,
  })
}
