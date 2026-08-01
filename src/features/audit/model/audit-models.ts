import { type AuditEventRowPayload } from "../schemas/audit-gateway-schema"
import { type AuditEvent } from "./audit-types"

export function toAuditEvent(row: AuditEventRowPayload): AuditEvent {
  return {
    actor: row.actor,
    actorUserId: row.actor_user_id,
    event: row.event,
    id: row.id,
    metadata: row.metadata,
    occurredAt: row.occurred_at,
    reason: row.reason,
    requestId: row.request_id,
    scope: row.scope,
    severity: row.severity,
    success: row.success,
    target: row.target,
    targetUserId: row.target_user_id,
  }
}

export function sortAuditEvents(events: readonly AuditEvent[]) {
  return [...events].sort((left, right) => {
    const timestampDifference =
      Date.parse(right.occurredAt) - Date.parse(left.occurredAt)

    return timestampDifference || right.id.localeCompare(left.id)
  })
}
