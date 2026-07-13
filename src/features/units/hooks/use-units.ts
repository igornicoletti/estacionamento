import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { listUnits } from "../services/units-service"
import { type Unit } from "../types/units-types"
import { unitsCopy } from "../units-copy"

export function useUnits() {
  const snapshot = useAsyncSnapshot<Unit[]>({
    cacheKey: "units:list:v2",
    errorMessage: unitsCopy.errors.unitsLoad,
    initialData: [],
    loadData: listUnits,
  })

  return snapshot
}
