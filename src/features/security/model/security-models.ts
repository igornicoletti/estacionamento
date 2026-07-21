import type { BadgeTone } from "@/lib"
import type { NotificationRecord } from "@/features/notifications"

import type {
  SecurityEventSummary,
  SecurityMeasureId,
  SecurityMeasureStatus,
  SecurityScore,
  SecuritySummary,
} from "../types/security-types"

export type SecurityMeasureStatuses = Record<SecurityMeasureId, SecurityMeasureStatus>

const SECURITY_EVENT_LIMIT = 4

function hasRecoveryContact(security: SecuritySummary) {
  return Boolean(security.account.phoneMasked?.trim())
}

function getNotificationTimestamp(notification: Pick<NotificationRecord, "occurredAt" | "id">) {
  const timestamp = Date.parse(notification.occurredAt)

  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function getSecurityMeasureStatuses(
  security: SecuritySummary
): SecurityMeasureStatuses {
  return {
    "strong-password": "completed",
    passkey: security.passkeyStatus === "active" ? "completed" : "action-required",
    "recovery-contact": hasRecoveryContact(security) ? "completed" : "action-required",
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

export function getSecurityScoreTone(score: SecurityScore): BadgeTone {
  if (score.value === 100) return "success"
  if (score.value >= 67) return "info"
  if (score.value >= 34) return "warning"
  return "destructive"
}

export function getRecentSecurityEvents(
  notifications: readonly NotificationRecord[]
): SecurityEventSummary[] {
  return notifications
    .filter((notification) => notification.type === "security")
    .sort((current, next) => {
      const timestampDiff =
        getNotificationTimestamp(next) - getNotificationTimestamp(current)

      return timestampDiff !== 0
        ? timestampDiff
        : next.id.localeCompare(current.id)
    })
    .slice(0, SECURITY_EVENT_LIMIT)
    .map((notification) => ({
      description: notification.description,
      href: notification.href,
      id: notification.id,
      occurredAt: notification.occurredAt,
      title: notification.title,
    }))
}
