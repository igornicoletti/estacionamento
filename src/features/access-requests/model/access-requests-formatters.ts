import type { RecoveryReason } from "@/features/auth"

import { accessRequestsCopy } from "../constants"
import type {
  AccessRecoveryContactVerificationStatus,
  AccessRecoveryRequestRecord,
} from "./access-requests-types"

export function formatAccessRequestReason(
  reason: RecoveryReason,
  description?: string | null
) {
  if (reason === "other" && description?.trim()) {
    return description.trim()
  }

  return accessRequestsCopy.reasonLabels[reason]
}

export function formatAccessRequestRequester(
  request: Pick<AccessRecoveryRequestRecord, "email" | "phoneMasked">
) {
  return request.email ?? request.phoneMasked ?? accessRequestsCopy.shared.emptyValue
}

export function formatAccessRecoveryTargetAccount(
  request: Pick<
    AccessRecoveryRequestRecord,
    "targetAccountFound" | "targetUserName"
  >
) {
  if (request.targetUserName) {
    return request.targetUserName
  }

  if (request.targetAccountFound === false) {
    return accessRequestsCopy.verification.accountNotFound
  }

  return accessRequestsCopy.verification.unverified
}

export function resolveAccessRecoveryVerificationStatus(
  request: Pick<
    AccessRecoveryRequestRecord,
    "emailMatchesAccount" | "phoneMatchesAccount" | "targetAccountFound"
  >
): AccessRecoveryContactVerificationStatus {
  if (request.targetAccountFound === false) {
    return "mismatch"
  }

  if (
    request.phoneMatchesAccount === false ||
    request.emailMatchesAccount === false
  ) {
    return "mismatch"
  }

  if (
    request.phoneMatchesAccount === true ||
    request.emailMatchesAccount === true
  ) {
    return "matched"
  }

  return "unverified"
}

export function formatAccessRecoveryVerificationLabel(
  request: Pick<
    AccessRecoveryRequestRecord,
    "emailMatchesAccount" | "phoneMatchesAccount" | "targetAccountFound"
  >
) {
  const status = resolveAccessRecoveryVerificationStatus(request)

  if (status === "matched") {
    return accessRequestsCopy.verification.contactMatched
  }

  if (request.targetAccountFound === false) {
    return accessRequestsCopy.verification.accountNotFound
  }

  if (status === "mismatch") {
    return accessRequestsCopy.verification.contactMismatch
  }

  return accessRequestsCopy.verification.unverified
}

export function formatBooleanVerification(
  value: boolean | null,
  labels: {
    matched: string
    mismatch: string
    unverified: string
  }
) {
  if (value === true) {
    return labels.matched
  }

  if (value === false) {
    return labels.mismatch
  }

  return labels.unverified
}
