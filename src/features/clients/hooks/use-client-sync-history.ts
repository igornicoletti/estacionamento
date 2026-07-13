import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { listClientSyncHistory } from "../services/client-sync-history-service"
import { type ClientSyncHistoryEntry } from "../types/clients-sync-history-types"
import { clientsCopy } from "../clients-copy"

export function useClientSyncHistory() {
  return useAsyncSnapshot<ClientSyncHistoryEntry[]>({
    cacheKey: "clients:sync-history:v2",
    errorMessage: clientsCopy.sync.historyLoadError,
    initialData: [],
    loadData: listClientSyncHistory,
  })
}
