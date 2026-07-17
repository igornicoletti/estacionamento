import {
  getAuditEventLabel,
  isAuditScope,
  isAuditSeverity,
  type AuditEvent,
  type RawAuditEventPayload,
} from "../types/audit-types"
import { auditCopy } from "../audit-copy"

const auditTechnicalValueLabels: Readonly<Record<string, string>> =
  auditCopy.technical.valueLabels

function sanitizeRawText(value: unknown) {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ")
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return ""
}

function toSentenceCase(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return ""
  }

  return normalized.charAt(0).toLocaleUpperCase("pt-BR") + normalized.slice(1)
}

function humanizeTechnicalIdentifier(value: string) {
  const mapped = auditTechnicalValueLabels[value]

  if (mapped) {
    return mapped
  }

  const humanized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")

  return toSentenceCase(humanized)
}

function sanitizeTechnicalMessage(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ")
  const lower = normalized.toLocaleLowerCase("pt-BR")

  if (lower.includes("notvalidforname") || lower.includes("invalid peer certificate")) {
    return auditCopy.technical.messages.certificate
  }

  if (lower.includes("error sending request") || lower.includes("client error")) {
    return auditCopy.technical.messages.externalService
  }

  return normalized
    .replace(/https?:\/\/\S+/gi, "serviço externo")
    .replace(/[<>]/g, "")
}

function sanitizeText(value: unknown) {
  if (typeof value === "string") {
    const text = sanitizeTechnicalMessage(value)

    return /^[a-z0-9_.-]+$/i.test(text)
      ? humanizeTechnicalIdentifier(text)
      : toSentenceCase(text)
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

function sanitizeNullableRawText(value: unknown): string | null {
  const text = sanitizeRawText(value)

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
  const event = sanitizeRawText(payload.event)

  return {
    id: sanitizeRawText(payload.id),
    occurredAt: sanitizeIsoTimestamp(payload.occurred_at),
    scope: isAuditScope(payload.scope) ? payload.scope : "system",
    event,
    eventLabel: getAuditEventLabel(event),
    actorName: sanitizeText(payload.actor) || auditCopy.labels.systemActor,
    actorUserId: sanitizeNullableRawText(payload.actor_user_id),
    target: sanitizeText(payload.target),
    targetUserId: sanitizeNullableRawText(payload.target_user_id),
    success: sanitizeBoolean(payload.success),
    severity: isAuditSeverity(payload.severity) ? payload.severity : "info",
    reason: sanitizeNullableText(payload.reason),
    requestId: sanitizeNullableRawText(payload.request_id),
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
