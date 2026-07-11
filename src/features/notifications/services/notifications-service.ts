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

export interface SetNotificationsStatusBatchResult {
  total: number
  updated: number
  failed: string[]
}

export interface NotificationsGateway {
  countUnreadNotifications(): Promise<number>
  listNotifications(): Promise<NotificationRecord[]>
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

function isNotificationType(value: string): value is NotificationType {
  return notificationTypeValues.includes(value as NotificationType)
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

function getReturnedId(value: unknown) {
  if (!value || typeof value !== "object" || !("id" in value)) {
    return null
  }

  const id = (value as Partial<ReturnedIdRow>).id

  return typeof id === "string" ? id : null
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
    const { data, error } = await supabaseClient
      .from("notification_deliveries")
      .select(
        "id, created_at, read_at, notification_events(created_at, description, href, title, type)"
      )
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(notificationsCopy.feedback.loadError, { cause: error })
    }

    return ((data ?? []) as RawNotificationDeliveryRow[])
      .map(mapNotificationDelivery)
      .filter((notification): notification is NotificationRecord =>
        Boolean(notification)
      )
  }

  async function countUnreadNotifications() {
    const { count, error } = await supabaseClient
      .from("notification_deliveries")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)

    if (error) {
      throw new Error(notificationsCopy.feedback.loadError, { cause: error })
    }

    return count ?? 0
  }

  async function setNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ) {
    const updateResponse = await supabaseClient.rpc("set_notification_read_status", {
      delivery_id: notificationId,
      is_read: status === "read",
    }) as { error: unknown }

    if (updateResponse.error) {
      const message = status === "read"
        ? notificationsCopy.feedback.markAsReadError
        : notificationsCopy.feedback.markAsUnreadError

      throw new Error(message, { cause: updateResponse.error })
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

    const updateResponse = await supabaseClient.rpc("set_notifications_read_status", {
      delivery_ids: uniqueIds,
      is_read: status === "read",
    }) as { data: unknown; error: unknown }

    if (updateResponse.error) {
      throw new Error(notificationsCopy.feedback.markAllAsReadError, {
        cause: updateResponse.error,
      })
    }

    const updatedIds = new Set(
      (Array.isArray(updateResponse.data) ? updateResponse.data : [])
        .map(getReturnedId)
        .filter((id): id is string => Boolean(id))
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
    const filter = options.recipientAuthUserId
      ? `recipient_auth_user_id=eq.${options.recipientAuthUserId}`
      : undefined
    const channel = supabaseClient
      .channel("notification-deliveries")
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

export function setNotificationsStatus(
  notificationIds: readonly string[],
  status: NotificationStatus
): Promise<SetNotificationsStatusBatchResult> {
  return getNotificationsGateway().setNotificationsStatus(notificationIds, status)
}

export function countUnreadNotifications(): Promise<number> {
  return getNotificationsGateway().countUnreadNotifications()
}
