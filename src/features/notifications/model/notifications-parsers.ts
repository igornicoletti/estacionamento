import { notificationsCopy } from "../constants"
import {
  notificationTypeValues,
  type NotificationEventRelation,
  type NotificationRecord,
  type NotificationType,
  type RawNotificationDeliveryRow,
  type ReturnedIdRow,
} from "./notifications-types"
import { isInternalNotificationHref } from "./notifications-rules"

type UnknownRecord = Record<PropertyKey, unknown>

export interface SupabaseMaybeErrorResponse {
  error: unknown
}

export interface SupabaseMaybeDataErrorResponse extends SupabaseMaybeErrorResponse {
  data: unknown
}

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isSupabaseMaybeErrorResponse(
  value: unknown
): value is SupabaseMaybeErrorResponse {
  return isRecord(value) && "error" in value
}

export function isSupabaseMaybeDataErrorResponse(
  value: unknown
): value is SupabaseMaybeDataErrorResponse {
  return isSupabaseMaybeErrorResponse(value) && "data" in value
}

function isNotificationType(value: string): value is NotificationType {
  return notificationTypeValues.includes(value as NotificationType)
}

function isNotificationEventRelation(
  value: unknown
): value is NotificationEventRelation {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.created_at === "string" &&
    typeof value.description === "string" &&
    (typeof value.href === "string" || value.href === null) &&
    typeof value.title === "string" &&
    typeof value.type === "string"
  )
}

export function isRawNotificationDeliveryRow(
  value: unknown
): value is RawNotificationDeliveryRow {
  if (!isRecord(value)) {
    return false
  }

  const relation = value.notification_events

  return (
    typeof value.id === "string" &&
    typeof value.created_at === "string" &&
    (typeof value.read_at === "string" || value.read_at === null) &&
    (
      relation === null ||
      isNotificationEventRelation(relation) ||
      (Array.isArray(relation) && relation.every(isNotificationEventRelation))
    )
  )
}

export function isReturnedIdRow(value: unknown): value is ReturnedIdRow {
  return isRecord(value) && typeof value.id === "string"
}

function getEventRelation(
  value: RawNotificationDeliveryRow["notification_events"]
) {
  return Array.isArray(value) ? value[0] ?? null : value
}

function normalizeHref(value: string | null): `/${string}` | undefined {
  return isInternalNotificationHref(value) ? value : undefined
}

export function normalizeReturnedIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isReturnedIdRow).map((row) => row.id)
}

export function mapNotificationDelivery(
  row: RawNotificationDeliveryRow
): NotificationRecord | null {
  const event = getEventRelation(row.notification_events)

  if (!event || !isNotificationType(event.type)) {
    return null
  }

  return {
    id: row.id,
    description: event.description,
    href: normalizeHref(event.href),
    occurredAt: event.created_at || row.created_at,
    status: row.read_at ? "read" : "unread",
    title: event.title,
    type: event.type,
  }
}

export function normalizeNotificationDeliveries(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error(notificationsCopy.feedback.invalidResponse)
  }

  return value
    .filter(isRawNotificationDeliveryRow)
    .map(mapNotificationDelivery)
    .filter((notification): notification is NotificationRecord => Boolean(notification))
}
