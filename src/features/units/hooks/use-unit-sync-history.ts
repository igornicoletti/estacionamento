import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { UNIT_SYNC_HISTORY_CACHE_KEY, unitsCopy } from "../constants"
import { type UnitSyncHistoryEntry } from "../model"
import { listUnitSyncHistory } from "../services"

export function useUnitSyncHistory() {
  return useAsyncSnapshot<UnitSyncHistoryEntry[]>({
    cacheKey: UNIT_SYNC_HISTORY_CACHE_KEY,
    errorMessage: unitsCopy.sync.historyLoadError,
    initialData: [],
    loadData: listUnitSyncHistory,
  })
}
