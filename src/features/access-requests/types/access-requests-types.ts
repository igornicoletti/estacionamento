import { type RecoveryReason } from "@/features/auth"

export const accessRequestReviewDecisionValues = ["approved", "denied"] as const

export type AccessRequestReviewDecision =
  (typeof accessRequestReviewDecisionValues)[number]

export interface AccessRecoveryRequestRecord {
  id: string
  createdAt: string
  description: string | null
  email: string | null
  phoneMasked: string
  reason: RecoveryReason
}

export interface AccessRequestsSnapshot {
  recoveryRequests: AccessRecoveryRequestRecord[]
}

export interface AccessRequestDetailsTarget {
  type: "recovery"
  request: AccessRecoveryRequestRecord
}
