import type { BadgeTone } from "@/lib"

import type {
  SecurityMeasureId,
  SecurityMeasureStatus,
  SecurityScore,
  SecuritySummary,
} from "../types/security-types"

export type SecurityMeasureStatuses = Record<SecurityMeasureId, SecurityMeasureStatus>

function hasRecoveryContact(security: SecuritySummary) {
  return Boolean(
    security.account.email?.trim() && security.account.phoneMasked?.trim()
  )
}

export function getSecurityMeasureStatuses(
  security: SecuritySummary
): SecurityMeasureStatuses {
  return {
    "two-factor-authentication": security.posture.mfaConfigured
      ? "completed"
      : "action-required",
    "strong-password": "completed",
    passkey: security.passkeyStatus === "active" ? "completed" : "action-required",
    "recovery-options": hasRecoveryContact(security)
      ? "completed"
      : "action-required",
    "recent-logins": security.posture.recentLoginsReviewed
      ? "completed"
      : "action-required",
    "trusted-devices": security.posture.trustedDevicesConfigured
      ? "completed"
      : "action-required",
  }
}

export function createSecurityScore(
  statuses: SecurityMeasureStatuses
): SecurityScore {
  const values = Object.values(statuses)
  const completed = values.filter((status) => status === "completed").length
  const total = values.length

  return {
    completed,
    remaining: Math.max(0, total - completed),
    total,
    value: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

export function getSecurityScoreTone(
  score: SecurityScore
): Exclude<BadgeTone, "secondary"> {
  if (score.completed === score.total && score.total > 0) return "success"
  if (score.completed >= 3) return "warning"
  return "error"
}
