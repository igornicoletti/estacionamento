import {
  type AuditScope,
  type AuditSeverity,
} from "../constants/audit-labels"

export type { AuditScope, AuditSeverity }

export interface AuditEvent {
  actor: string
  actorUserId: string | null
  event: string
  id: string
  metadata: Record<string, unknown> | null
  occurredAt: string
  reason: string | null
  requestId: string | null
  scope: AuditScope
  severity: AuditSeverity
  success: boolean
  target: string
  targetUserId: string | null
}

export interface AuditSnapshot {
  events: AuditEvent[]
  isTruncated: boolean
}

export interface AuditEventDetailItem {
  id: string
  label: string
  value: string
}
