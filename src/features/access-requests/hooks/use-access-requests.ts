import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { toError } from "@/lib"

import { accessRequestsCopy } from "../constants"
import type { AccessRequestReviewDecision, AccessRequestsSnapshot } from "../model"
import { listPendingRecoveryRequests, reviewRecoveryRequest } from "../services"

const initialSnapshot: AccessRequestsSnapshot = {
  recoveryRequests: [],
}

async function loadAccessRequests(): Promise<AccessRequestsSnapshot> {
  const recoveryRequests = await listPendingRecoveryRequests()

  return { recoveryRequests }
}

export function useAccessRequests() {
  const { data, error, isLoading, refetch, setError } = useAsyncSnapshot<AccessRequestsSnapshot>({
    cacheKey: "access-requests:list:v2",
    errorMessage: accessRequestsCopy.feedback.loadError,
    initialData: initialSnapshot,
    loadData: loadAccessRequests,
  })
  const [isReviewing, setIsReviewing] = React.useState(false)

  const reviewRecovery = React.useCallback(
    async (requestId: string, decision: AccessRequestReviewDecision, temporaryPassword?: string) => {
      setIsReviewing(true)
      setError(null)

      try {
        await reviewRecoveryRequest(requestId, decision, temporaryPassword)
        await refetch()
      } catch (caughtError) {
        const nextError = toError(caughtError, accessRequestsCopy.feedback.recovery[decision].error)
        setError(nextError)
        throw nextError
      } finally {
        setIsReviewing(false)
      }
    },
    [refetch, setError]
  )

  return {
    data,
    error,
    isLoading,
    isReviewing,
    refetch,
    reviewRecovery,
  }
}
