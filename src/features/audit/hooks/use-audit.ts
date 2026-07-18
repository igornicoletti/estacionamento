import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { auditCopy, AUDIT_EVENTS_FETCH_LIMIT } from "../constants"
import {
  listAuditEvents,
  type AuditEventsResult,
} from "../services"

const initialAuditEventsResult: AuditEventsResult = {
  events: [],
  isTruncated: false,
  limit: AUDIT_EVENTS_FETCH_LIMIT,
}

export function useAudit() {
  const { data, error, isLoading, refetch } = useAsyncSnapshot<AuditEventsResult>({
    cacheKey: "audit:list",
    initialData: initialAuditEventsResult,
    loadData: listAuditEvents,
    errorMessage: auditCopy.feedback.loadError,
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
