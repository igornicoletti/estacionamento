import { isUserRole, type UserRole } from "@/features/auth"

import {
  isAuditAction,
  isAuditOutcome,
  type AuditAction,
  type AuditEvent,
  type AuditOutcome,
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

function sanitizeRole(value: unknown): UserRole | null {
  return isUserRole(value) ? value : null
}

function sanitizeAction(value: unknown): AuditAction {
  return isAuditAction(value) ? value : "settings.updated"
}

function sanitizeOutcome(value: unknown): AuditOutcome {
  return isAuditOutcome(value) ? value : "failure"
}

export function sanitizeAuditEventPayload(
  payload: RawAuditEventPayload
): AuditEvent {
  return {
    id: sanitizeText(payload.id),
    occurredAt: sanitizeIsoTimestamp(payload.occurred_at),
    actorName: sanitizeText(payload.actor_name) || "Sistema",
    actorRole: sanitizeRole(payload.actor_role),
    action: sanitizeAction(payload.action),
    outcome: sanitizeOutcome(payload.outcome),
    entity: sanitizeText(payload.entity),
    entityId: sanitizeText(payload.entity_id),
    unitName: sanitizeNullableText(payload.unit_name),
    ipAddress: sanitizeText(payload.ip_address),
    userAgent: sanitizeText(payload.user_agent),
    description: sanitizeText(payload.description),
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
