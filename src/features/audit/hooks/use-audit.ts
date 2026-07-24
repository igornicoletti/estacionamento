import * as React from "react"

import { listAuditEvents } from "../services/audit-service"
import { type AuditEvent } from "../types/audit-types"

const auditLoadError = "Não foi possível carregar a trilha de auditoria."

function toLoadError(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError : new Error(auditLoadError)
}

export function useAudit() {
  const [data, setData] = React.useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const refetch = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const events = await listAuditEvents()

      setData(events)
    } catch (caughtError) {
      setError(toLoadError(caughtError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialAudit() {
      try {
        const events = await listAuditEvents()

        if (isMounted) {
          setData(events)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(toLoadError(caughtError))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialAudit()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}
