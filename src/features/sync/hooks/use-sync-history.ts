import * as React from "react"

import { type SyncHistorySnapshot, type SyncResource } from "../model/sync-types"
import { listSyncHistory } from "../services/sync-service"

export function useSyncHistory(resource: SyncResource, enabled: boolean) {
  const [data, setData] = React.useState<SyncHistorySnapshot | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const generationRef = React.useRef(0)

  const refetch = React.useCallback(async () => {
    const generation = ++generationRef.current
    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await listSyncHistory(resource)

      if (generation === generationRef.current) setData(snapshot)
    } catch (caughtError) {
      if (generation === generationRef.current) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error("Não foi possível carregar o histórico.")
        )
      }
    } finally {
      if (generation === generationRef.current) setIsLoading(false)
    }
  }, [resource])

  React.useEffect(() => {
    let isCurrent = true

    async function loadEnabledHistory() {
      await Promise.resolve()

      if (isCurrent && enabled) {
        await refetch()
      }
    }

    void loadEnabledHistory()

    return () => {
      isCurrent = false
      generationRef.current += 1
    }
  }, [enabled, refetch])

  return { data, error, isLoading, refetch }
}
