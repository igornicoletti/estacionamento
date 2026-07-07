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

export interface PendingPhoneChangeRequestRecord {
  id: string
  authUserId: string
  currentPhoneMasked: string | null
  name: string
  pendingPhoneMasked: string
  requestedAt: string
}

export interface AccessRequestsSnapshot {
  phoneChanges: PendingPhoneChangeRequestRecord[]
  recoveryRequests: AccessRecoveryRequestRecord[]
}
