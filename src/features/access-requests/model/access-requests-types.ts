import type { RecoveryReason } from "@/features/auth"

export const accessRequestReviewDecisionValues = ["approved", "denied"] as const

export type AccessRequestReviewDecision = (typeof accessRequestReviewDecisionValues)[number]
export type AccessRecoveryContactVerificationStatus =
  | "matched"
  | "mismatch"
  | "unverified"

export interface AccessRecoveryRequestRecord {
  createdAt: string
  description: string | null
  email: string | null
  emailMatchesAccount: boolean | null
  id: string
  phoneMatchesAccount: boolean | null
  phoneMasked: string | null
  reason: RecoveryReason
  reasonLabel: string
  requesterLabel: string
  targetAccountFound: boolean | null
  targetAccountLabel: string
  targetUserName: string | null
  verificationLabel: string
  verificationStatus: AccessRecoveryContactVerificationStatus
}

export interface AccessRequestsSnapshot {
  recoveryRequests: AccessRecoveryRequestRecord[]
}

export interface AccessRequestDetailsTarget {
  request: AccessRecoveryRequestRecord
  type: "recovery"
}
