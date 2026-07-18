import { auditCopy } from "../constants"
import { getAuditEventLabel, humanizeAuditIdentifier } from "./audit-event-labels"
import {
  isAuditScope,
  isAuditSeverity,
  type AuditEvent,
  type RawAuditEventPayload,
} from "./audit-types"

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
  return auditTechnicalValueLabels[value] ?? humanizeAuditIdentifier(value)
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

  return normalized.replace(/https?:\/\/\S+/gi, "serviço externo").replace(/[<>]/g, "")
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

function isSanitizableMetadataValue(value: unknown) {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
}

function sanitizeMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const metadata = Object.entries(value as Record<string, unknown>).reduce<
    Record<string, unknown>
  >((accumulator, [key, item]) => {
    const normalizedKey = sanitizeRawText(key)

    if (!normalizedKey || !isSanitizableMetadataValue(item)) {
      return accumulator
    }

    accumulator[normalizedKey] = typeof item === "string" ? sanitizeTechnicalMessage(item) : item

    return accumulator
  }, {})

  return Object.keys(metadata).length > 0 ? metadata : null
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
