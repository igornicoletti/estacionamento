import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { toError } from "@/lib"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  listPendingPhoneChanges,
  listPendingRecoveryRequests,
  reviewPhoneChange,
  reviewRecoveryRequest,
} from "../services/access-requests-service"
import {
  type AccessRequestReviewDecision,
  type AccessRequestsSnapshot,
} from "../types/access-requests-types"

const initialSnapshot: AccessRequestsSnapshot = {
  phoneChanges: [],
  recoveryRequests: [],
}

async function loadAccessRequests(): Promise<AccessRequestsSnapshot> {
  const [recoveryRequests, phoneChanges] = await Promise.all([
    listPendingRecoveryRequests(),
    listPendingPhoneChanges(),
  ])

  return { phoneChanges, recoveryRequests }
}

export function useAccessRequests() {
  const {
    data,
    error,
    isLoading,
    refetch,
    setError,
  } = useAsyncSnapshot<AccessRequestsSnapshot>({
    cacheKey: "access-requests:list:v2",
    errorMessage: accessRequestsCopy.feedback.loadError,
    initialData: initialSnapshot,
    loadData: loadAccessRequests,
  })
  const [isReviewing, setIsReviewing] = React.useState(false)

  const reviewRecovery = React.useCallback(
    async (
      requestId: string,
      decision: AccessRequestReviewDecision,
      reviewReason: string
    ) => {
      setIsReviewing(true)
      setError(null)

      try {
        await reviewRecoveryRequest(requestId, decision, reviewReason)
        await refetch()
      } catch (caughtError) {
        const nextError = toError(
          caughtError,
          accessRequestsCopy.feedback.recovery[decision].error
        )
        setError(nextError)
        throw nextError
      } finally {
        setIsReviewing(false)
      }
    },
    [refetch, setError]
  )

  const reviewPhone = React.useCallback(
    async (
      targetUserId: string,
      decision: AccessRequestReviewDecision
    ) => {
      setIsReviewing(true)
      setError(null)

      try {
        await reviewPhoneChange(targetUserId, decision)
        await refetch()
      } catch (caughtError) {
        const nextError = toError(
          caughtError,
          accessRequestsCopy.feedback.phoneChanges[decision].error
        )
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
    reviewPhone,
    reviewRecovery,
  }
}
