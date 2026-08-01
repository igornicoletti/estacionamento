import * as React from "react"

import { auditCopy } from "../constants/audit-copy"
import { type AuditSnapshot } from "../model/audit-types"
import { listAuditEvents } from "../services/audit-service"

const emptyAuditSnapshot: AuditSnapshot = {
  events: [],
  isTruncated: false,
}

function toLoadError(caughtError: unknown) {
  return caughtError instanceof Error
    ? caughtError
    : new Error(auditCopy.feedback.loadError)
}

export function useAudit() {
  const [snapshot, setSnapshot] =
    React.useState<AuditSnapshot>(emptyAuditSnapshot)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const loadGenerationRef = React.useRef(0)

  const loadAudit = React.useCallback(async () => {
    const generation = ++loadGenerationRef.current

    try {
      setIsLoading(true)
      setError(null)

      const nextSnapshot = await listAuditEvents()

      if (generation === loadGenerationRef.current) {
        setSnapshot(nextSnapshot)
      }
    } catch (caughtError) {
      if (generation === loadGenerationRef.current) {
        setError(toLoadError(caughtError))
      }
    } finally {
      if (generation === loadGenerationRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAudit()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      loadGenerationRef.current += 1
    }
  }, [loadAudit])

  return {
    data: snapshot.events,
    error,
    isLoading,
    isTruncated: snapshot.isTruncated,
    refetch: loadAudit,
  }
}
