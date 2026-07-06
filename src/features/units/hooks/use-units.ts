import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { listUnits } from "../services/units-service"
import { type Unit } from "../types/units-types"
import { unitsCopy } from "../units-copy"

const unitsLoadError = unitsCopy.errors.unitsLoad

export function useUnits() {
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useAsyncSnapshot<Unit[]>({
    cacheKey: "units:list",
    initialData: [],
    loadData: listUnits,
    errorMessage: unitsLoadError,
  })

  return { data, error, isLoading, refetch }
}
