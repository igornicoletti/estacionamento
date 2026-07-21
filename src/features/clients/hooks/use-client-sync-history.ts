import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENTS_SYNC_HISTORY_CACHE_KEY } from "../constants/clients-persistence"
import { type ClientSyncHistoryEntry } from "../model"
import { listClientSyncHistory } from "../services"

interface UseClientSyncHistoryOptions {
  enabled?: boolean
}

export function useClientSyncHistory(options: UseClientSyncHistoryOptions = {}) {
  const enabled = options.enabled ?? true

  return useAsyncSnapshot<ClientSyncHistoryEntry[]>({
    cacheKey: `${CLIENTS_SYNC_HISTORY_CACHE_KEY}:${enabled ? "enabled" : "disabled"}`,
    errorMessage: clientsCopy.sync.historyLoadError,
    initialData: [],
    loadData: () => enabled ? listClientSyncHistory() : Promise.resolve([]),
  })
}
