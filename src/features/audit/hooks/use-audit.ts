import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { auditCopy } from "../audit-copy"
import { listAuditEvents } from "../services/audit-service"
import { type AuditEvent } from "../types/audit-types"

const auditLoadError = auditCopy.feedback.loadError

export function useAudit() {
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useAsyncSnapshot<AuditEvent[]>({
    cacheKey: "audit:list",
    initialData: [],
    loadData: listAuditEvents,
    errorMessage: auditLoadError,
  })

  return { data, error, isLoading, refetch }
}
