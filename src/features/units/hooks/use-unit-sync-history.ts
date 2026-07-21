import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_SYNC_HISTORY_CACHE_KEY } from "../constants/units-persistence"
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
