import { getSupabaseBrowserClient } from "@/lib"

import { notificationsCopy } from "../notifications-copy"
import {
  notificationTypeValues,
  type NotificationRecord,
  type NotificationStatus,
  type NotificationType,
} from "../types/notifications-types"
import { isInternalNotificationHref } from "../utils/notifications-rules"

type NotificationEventRelation = {
  created_at: string
  description: string
  href: string | null
  title: string
  type: string
}

type RawNotificationDeliveryRow = {
  id: string
  created_at: string
  read_at: string | null
  notification_events: NotificationEventRelation | NotificationEventRelation[] | null
}

type ReturnedIdRow = {
  id: string
}

interface SupabaseMaybeErrorResponse {
  error: unknown
}

interface SupabaseMaybeDataErrorResponse {
  data: unknown
  error: unknown
}

export interface SetNotificationsStatusBatchResult {
  total: number
  updated: number
  failed: string[]
}

export interface NotificationsGateway {
  countUnreadNotifications(): Promise<number>
  listNotifications(): Promise<NotificationRecord[]>
  markAllNotificationsAsRead(): Promise<SetNotificationsStatusBatchResult>
  setNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ): Promise<NotificationRecord>
  setNotificationsStatus(
    notificationIds: readonly string[],
    status: NotificationStatus
  ): Promise<SetNotificationsStatusBatchResult>
  subscribeNotifications(
    listener: () => void,
    options?: { recipientAuthUserId?: string | null }
  ): () => void
}

let configuredGateway: NotificationsGateway | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object")
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

function isRawNotificationDeliveryRow(
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

function isReturnedIdRow(value: unknown): value is ReturnedIdRow {
  return isRecord(value) && typeof value.id === "string"
}

function isSupabaseMaybeErrorResponse(
  value: unknown
): value is SupabaseMaybeErrorResponse {
  return isRecord(value) && "error" in value
}

function isSupabaseMaybeDataErrorResponse(
  value: unknown
): value is SupabaseMaybeDataErrorResponse {
  return isSupabaseMaybeErrorResponse(value) && "data" in value
}

function getEventRelation(
  value: RawNotificationDeliveryRow["notification_events"]
) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function normalizeHref(value: string | null): `/${string}` | undefined {
  return isInternalNotificationHref(value) ? value : undefined
}

function normalizeReturnedIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isReturnedIdRow).map((row) => row.id)
}

function mapNotificationDelivery(
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

function createEmptyNotificationsGateway(): NotificationsGateway {
  const listeners = new Set<() => void>()

  return {
    async countUnreadNotifications() {
      await Promise.resolve()
      return 0
    },
    async listNotifications() {
      await Promise.resolve()
      return []
    },
    async markAllNotificationsAsRead() {
      await Promise.resolve()
      return {
        failed: [],
        total: 0,
        updated: 0,
      }
    },
    async setNotificationStatus(notificationId) {
      await Promise.resolve()
      throw new Error(`Notificação não encontrada: ${notificationId}`)
    },
    async setNotificationsStatus(notificationIds) {
      await Promise.resolve()
      const uniqueIds = [...new Set(notificationIds)]

      return {
        failed: uniqueIds,
        total: uniqueIds.length,
        updated: 0,
      }
    },
    subscribeNotifications(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

function createSupabaseNotificationsGateway(): NotificationsGateway {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return createEmptyNotificationsGateway()
  }

  const supabaseClient = supabase

  async function listNotifications() {
    const response = await supabaseClient
      .from("notification_deliveries")
      .select(
        "id, created_at, read_at, notification_events(created_at, description, href, title, type)"
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100)

    if (response.error) {
      throw new Error(notificationsCopy.feedback.loadError, { cause: response.error })
    }

    return (response.data ?? [])
      .filter(isRawNotificationDeliveryRow)
      .map(mapNotificationDelivery)
      .filter((notification): notification is NotificationRecord => Boolean(notification))
  }

  async function countUnreadNotifications() {
    const response = await supabaseClient
      .from("notification_deliveries")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)

    if (response.error) {
      throw new Error(notificationsCopy.feedback.loadError, { cause: response.error })
    }

    return response.count ?? 0
  }

  async function setNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ) {
    const response: unknown = await supabaseClient.rpc("set_notification_read_status", {
      delivery_id: notificationId,
      is_read: status === "read",
    })

    if (isSupabaseMaybeErrorResponse(response) && response.error) {
      const message = status === "read"
        ? notificationsCopy.feedback.markAsReadError
        : notificationsCopy.feedback.markAsUnreadError

      throw new Error(message, { cause: response.error })
    }

    const notifications = await listNotifications()
    const updatedNotification = notifications.find(
      (notification) => notification.id === notificationId
    )

    if (!updatedNotification) {
      throw new Error("Notificação não encontrada.")
    }

    return updatedNotification
  }


  async function markAllNotificationsAsRead() {
    const unreadCountBeforeUpdate = await countUnreadNotifications()

    if (unreadCountBeforeUpdate === 0) {
      return {
        failed: [],
        total: 0,
        updated: 0,
      }
    }

    const response: unknown = await supabaseClient.rpc("set_all_notifications_read_status", {
      is_read: true,
    })

    if (isSupabaseMaybeDataErrorResponse(response) && response.error) {
      throw new Error(notificationsCopy.feedback.markAllAsReadError, {
        cause: response.error,
      })
    }

    const updatedIds = isSupabaseMaybeDataErrorResponse(response)
      ? normalizeReturnedIds(response.data)
      : []

    return {
      failed: [],
      total: unreadCountBeforeUpdate,
      updated: updatedIds.length,
    }
  }

  async function setNotificationsStatus(
    notificationIds: readonly string[],
    status: NotificationStatus
  ) {
    const uniqueIds = [...new Set(notificationIds)]

    if (uniqueIds.length === 0) {
      return {
        failed: [],
        total: 0,
        updated: 0,
      }
    }

    const response: unknown = await supabaseClient.rpc("set_notifications_read_status", {
      delivery_ids: uniqueIds,
      is_read: status === "read",
    })

    if (isSupabaseMaybeDataErrorResponse(response) && response.error) {
      throw new Error(notificationsCopy.feedback.markAllAsReadError, {
        cause: response.error,
      })
    }

    const updatedIds = new Set(
      isSupabaseMaybeDataErrorResponse(response)
        ? normalizeReturnedIds(response.data)
        : []
    )

    return {
      failed: uniqueIds.filter((id) => !updatedIds.has(id)),
      total: uniqueIds.length,
      updated: updatedIds.size,
    }
  }

  function subscribeNotifications(
    listener: () => void,
    options: { recipientAuthUserId?: string | null } = {}
  ) {
    const recipientAuthUserId = options.recipientAuthUserId ?? null
    const filter = recipientAuthUserId
      ? `recipient_auth_user_id=eq.${recipientAuthUserId}`
      : undefined
    const channelName = recipientAuthUserId
      ? `notification-deliveries:${recipientAuthUserId}`
      : "notification-deliveries"
    const channel = supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_deliveries",
          ...(filter ? { filter } : {}),
        },
        listener
      )
      .subscribe()

    return () => {
      void supabaseClient.removeChannel(channel)
    }
  }

  return {
    countUnreadNotifications,
    listNotifications,
    markAllNotificationsAsRead,
    setNotificationStatus,
    setNotificationsStatus,
    subscribeNotifications,
  }
}

function getNotificationsGateway() {
  return configuredGateway ?? createSupabaseNotificationsGateway()
}

export function setNotificationsGateway(gateway: NotificationsGateway) {
  configuredGateway = gateway
}

export function resetNotificationsGateway() {
  configuredGateway = null
}

export function createMemoryNotificationsGateway(
  seedNotifications: readonly NotificationRecord[]
): NotificationsGateway {
  let notifications = seedNotifications.map((notification) => ({ ...notification }))
  const listeners = new Set<() => void>()

  function emitChange() {
    listeners.forEach((listener) => {
      listener()
    })
  }

  return {
    async countUnreadNotifications() {
      await Promise.resolve()
      return notifications.filter((notification) => notification.status === "unread")
        .length
    },
    async listNotifications() {
      await Promise.resolve()
      return notifications.map((notification) => ({ ...notification }))
    },
    async markAllNotificationsAsRead() {
      await Promise.resolve()
      const unreadIds = notifications
        .filter((notification) => notification.status === "unread")
        .map((notification) => notification.id)

      if (unreadIds.length === 0) {
        return {
          failed: [],
          total: 0,
          updated: 0,
        }
      }

      notifications = notifications.map((notification) =>
        notification.status === "unread"
          ? { ...notification, status: "read" }
          : notification
      )
      emitChange()

      return {
        failed: [],
        total: unreadIds.length,
        updated: unreadIds.length,
      }
    },
    async setNotificationStatus(notificationId, status) {
      await Promise.resolve()
      const currentNotification = notifications.find(
        (notification) => notification.id === notificationId
      )

      if (!currentNotification) {
        throw new Error("Notificação não encontrada.")
      }

      const updatedNotification = {
        ...currentNotification,
        status,
      }

      notifications = notifications.map((notification) =>
        notification.id === notificationId ? updatedNotification : notification
      )
      emitChange()

      return updatedNotification
    },
    async setNotificationsStatus(notificationIds, status) {
      await Promise.resolve()
      const uniqueIds = [...new Set(notificationIds)]
      const failed: string[] = []
      let updated = 0

      for (const notificationId of uniqueIds) {
        const currentNotification = notifications.find(
          (notification) => notification.id === notificationId
        )

        if (!currentNotification) {
          failed.push(notificationId)
          continue
        }

        if (currentNotification.status !== status) {
          notifications = notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, status }
              : notification
          )
          updated += 1
        }
      }

      if (updated > 0) {
        emitChange()
      }

      return {
        failed,
        total: uniqueIds.length,
        updated,
      }
    },
    subscribeNotifications(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function subscribeNotifications(
  listener: () => void,
  options?: { recipientAuthUserId?: string | null }
) {
  return getNotificationsGateway().subscribeNotifications(listener, options)
}

export function listNotifications(): Promise<NotificationRecord[]> {
  return getNotificationsGateway().listNotifications()
}

export function setNotificationStatus(
  notificationId: string,
  status: NotificationStatus
): Promise<NotificationRecord> {
  return getNotificationsGateway().setNotificationStatus(notificationId, status)
}

export function markAllNotificationsAsRead(): Promise<SetNotificationsStatusBatchResult> {
  return getNotificationsGateway().markAllNotificationsAsRead()
}

export function setNotificationsStatus(
  notificationIds: readonly string[],
  status: NotificationStatus
): Promise<SetNotificationsStatusBatchResult> {
  return getNotificationsGateway().setNotificationsStatus(notificationIds, status)
}

export function countUnreadNotifications(): Promise<number> {
  return getNotificationsGateway().countUnreadNotifications()
}
