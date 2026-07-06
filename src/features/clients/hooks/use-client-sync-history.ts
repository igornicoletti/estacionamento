import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { listClientSyncHistory } from "../services/client-sync-history-service"
import { type ClientSyncHistoryEntry } from "../types/clients-sync-history-types"

const clientSyncHistoryLoadError = "Nao foi possivel carregar o historico de sincronizacao."

export function useClientSyncHistory() {
  return useAsyncSnapshot<ClientSyncHistoryEntry[]>({
    cacheKey: "clients:sync-history",
    initialData: [],
    loadData: listClientSyncHistory,
    errorMessage: clientSyncHistoryLoadError,
  })
}
