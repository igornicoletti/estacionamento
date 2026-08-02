import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { securityCopy } from "../constants/security-copy"
import { getCurrentSecurityEvents } from "../services/security-events-service"
import { type SecurityEventSummary } from "../types/security-types"

export function useSecurityEvents(authUserId: string | null | undefined) {
  const loadData = React.useCallback(
    () => authUserId ? getCurrentSecurityEvents() : Promise.resolve([]),
    [authUserId]
  )

  return useAsyncSnapshot<SecurityEventSummary[]>({
    cacheKey: authUserId ? `security:events:${authUserId}` : undefined,
    errorMessage: securityCopy.events.error,
    initialData: [],
    loadData,
  })
}
