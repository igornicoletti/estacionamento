import * as React from "react"

import { toError } from "@/lib"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  listPendingPhoneChanges,
  listPendingRecoveryRequests,
  reviewPhoneChange,
  reviewRecoveryRequest,
} from "../services/access-requests-service"
import {
  type AccessRequestsSnapshot,
  type AccessRequestReviewDecision,
} from "../types/access-requests-types"

async function loadAccessRequests(): Promise<AccessRequestsSnapshot> {
  const [recoveryRequests, phoneChanges] = await Promise.all([
    listPendingRecoveryRequests(),
    listPendingPhoneChanges(),
  ])

  return { phoneChanges, recoveryRequests }
}

const initialSnapshot: AccessRequestsSnapshot = {
  phoneChanges: [],
  recoveryRequests: [],
}

export function useAccessRequests() {
  const {
    data,
    error,
    isLoading,
    refetch,
    setError,
  } = useAsyncSnapshot<AccessRequestsSnapshot>({
    cacheKey: "access-requests:list",
    errorMessage: accessRequestsCopy.feedback.loadError,
    initialData: initialSnapshot,
    loadData: loadAccessRequests,
  })
  const [isReviewing, setIsReviewing] = React.useState(false)

  const reviewRecovery = React.useCallback(async (
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
  }, [refetch, setError])

  const reviewPhone = React.useCallback(async (
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
  }, [refetch, setError])

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
