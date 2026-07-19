import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { CLIENTS_SYNC_HISTORY_CACHE_KEY, clientsCopy } from "../constants"
import { type ClientSyncHistoryEntry } from "../model"
import { listClientSyncHistory } from "../services"

export function useClientSyncHistory() {
  return useAsyncSnapshot<ClientSyncHistoryEntry[]>({
    cacheKey: CLIENTS_SYNC_HISTORY_CACHE_KEY,
    errorMessage: clientsCopy.sync.historyLoadError,
    initialData: [],
    loadData: listClientSyncHistory,
  })
}
