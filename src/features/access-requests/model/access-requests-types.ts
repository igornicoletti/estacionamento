import type { RecoveryReason } from "@/features/auth"

export const accessRequestReviewDecisionValues = ["approved", "denied"] as const

export type AccessRequestReviewDecision = (typeof accessRequestReviewDecisionValues)[number]

export interface AccessRecoveryRequestRecord {
  createdAt: string
  description: string | null
  email: string | null
  id: string
  phoneMasked: string
  reason: RecoveryReason
}

export interface AccessRequestsSnapshot {
  recoveryRequests: AccessRecoveryRequestRecord[]
}

export interface AccessRequestDetailsTarget {
  request: AccessRecoveryRequestRecord
  type: "recovery"
}
