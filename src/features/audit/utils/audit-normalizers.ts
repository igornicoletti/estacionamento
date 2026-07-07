import {
  getAuditEventLabel,
  isAuditScope,
  isAuditSeverity,
  type AuditEvent,
  type RawAuditEventPayload,
} from "../types/audit-types"

function sanitizeText(value: unknown) {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ")
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return ""
}

function sanitizeNullableText(value: unknown): string | null {
  const text = sanitizeText(value)

  return text.length > 0 ? text : null
}

function sanitizeIsoTimestamp(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  return new Date(0).toISOString()
}

function sanitizeBoolean(value: unknown): boolean {
  return value === true
}

function sanitizeMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const entries = Object.entries(value as Record<string, unknown>)

  return entries.length > 0 ? (value as Record<string, unknown>) : null
}

export function sanitizeAuditEventPayload(
  payload: RawAuditEventPayload
): AuditEvent {
  const event = sanitizeText(payload.event)

  return {
    id: sanitizeText(payload.id),
    occurredAt: sanitizeIsoTimestamp(payload.occurred_at),
    scope: isAuditScope(payload.scope) ? payload.scope : "system",
    event,
    eventLabel: getAuditEventLabel(event),
    actorName: sanitizeText(payload.actor) || "Sistema",
    actorUserId: sanitizeNullableText(payload.actor_user_id),
    target: sanitizeText(payload.target),
    targetUserId: sanitizeNullableText(payload.target_user_id),
    success: sanitizeBoolean(payload.success),
    severity: isAuditSeverity(payload.severity) ? payload.severity : "info",
    reason: sanitizeNullableText(payload.reason),
    requestId: sanitizeNullableText(payload.request_id),
    metadata: sanitizeMetadata(payload.metadata),
  }
}

export function sanitizeAuditEventsPayload(
  payload: readonly RawAuditEventPayload[]
): AuditEvent[] {
  return payload
    .map(sanitizeAuditEventPayload)
    .filter((event) => event.id.length > 0)
    .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt))
}
