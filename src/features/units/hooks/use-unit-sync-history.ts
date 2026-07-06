import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { listUnitSyncHistory } from "../services/unit-sync-history-service"
import { type UnitSyncHistoryEntry } from "../types/units-sync-history-types"

const unitSyncHistoryLoadError = "Não foi possível carregar o histórico de sincronização."

export function useUnitSyncHistory() {
  return useAsyncSnapshot<UnitSyncHistoryEntry[]>({
    cacheKey: "units:sync-history",
    initialData: [],
    loadData: listUnitSyncHistory,
    errorMessage: unitSyncHistoryLoadError,
  })
}
