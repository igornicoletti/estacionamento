import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { auditCopy } from "../audit-copy"
import {
  listAuditEvents,
  type AuditEventsResult,
} from "../services/audit-service"

const auditLoadError = auditCopy.feedback.loadError
const initialAuditEventsResult: AuditEventsResult = {
  events: [],
  isTruncated: false,
  limit: 500,
}

export function useAudit() {
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useAsyncSnapshot<AuditEventsResult>({
    cacheKey: "audit:list",
    initialData: initialAuditEventsResult,
    loadData: listAuditEvents,
    errorMessage: auditLoadError,
  })

  return {
    data: data.events,
    error,
    isLoading,
    isTruncated: data.isTruncated,
    limit: data.limit,
    refetch,
  }
}
