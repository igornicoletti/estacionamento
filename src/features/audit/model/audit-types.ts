import {
  auditScopeValues,
  auditSeverityValues,
  type AuditScope,
  type AuditSeverity,
} from "../constants"

export type { AuditScope, AuditSeverity }

export interface RawAuditEventPayload {
  id: unknown
  occurred_at: unknown
  scope: unknown
  event: unknown
  actor: unknown
  actor_user_id: unknown
  target: unknown
  target_user_id: unknown
  success: unknown
  severity: unknown
  reason: unknown
  request_id: unknown
  metadata: unknown
}

export interface AuditEvent {
  id: string
  occurredAt: string
  scope: AuditScope
  event: string
  eventLabel: string
  actorName: string
  actorUserId: string | null
  target: string
  targetUserId: string | null
  success: boolean
  severity: AuditSeverity
  reason: string | null
  requestId: string | null
  metadata: Record<string, unknown> | null
}

export interface AuditEventDetailItem {
  id: string
  label: string
  value: string
}

export function isAuditScope(value: unknown): value is AuditScope {
  return (
    typeof value === "string" && auditScopeValues.includes(value as AuditScope)
  )
}

export function isAuditSeverity(value: unknown): value is AuditSeverity {
  return (
    typeof value === "string" &&
    auditSeverityValues.includes(value as AuditSeverity)
  )
}
