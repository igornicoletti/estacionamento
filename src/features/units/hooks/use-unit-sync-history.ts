import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { listUnitSyncHistory } from "../services/unit-sync-history-service"
import { type UnitSyncHistoryEntry } from "../types/units-sync-history-types"
import { unitsCopy } from "../units-copy"

export function useUnitSyncHistory() {
  return useAsyncSnapshot<UnitSyncHistoryEntry[]>({
    cacheKey: "units:sync-history:v2",
    errorMessage: unitsCopy.sync.historyLoadError,
    initialData: [],
    loadData: listUnitSyncHistory,
  })
}
