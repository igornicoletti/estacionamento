import { getSupabaseBrowserClient } from "@/lib"

import { notificationsCopy } from "../constants"
import {
  normalizeNotificationDeliveries,
  normalizeReturnedIds,
  type NotificationRecord,
  type NotificationsGateway,
  type NotificationStatus,
  type SetNotificationsStatusBatchResult,
} from "../model"

type SupabaseBrowserClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>

const NOTIFICATION_DELIVERY_SELECT =
  "id, created_at, read_at, notification_events(created_at, description, href, title, type)"

function createEmptyNotificationsGateway(): NotificationsGateway {
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
    async setNotificationStatus() {
      await Promise.resolve()
      throw new Error(notificationsCopy.feedback.unavailableClient)
    },
    async setNotificationsStatus(notificationIds) {
      await Promise.resolve()
      return {
        failed: [...new Set(notificationIds)],
        total: new Set(notificationIds).size,
        updated: 0,
      }
    },
    subscribeNotifications() {
      return () => undefined
    },
  }
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(notificationsCopy.feedback.unavailableClient)
  }

  return supabase
}

async function getNotificationById(
  supabase: SupabaseBrowserClient,
  notificationId: string
) {
  const response = await supabase
    .from("notification_deliveries")
    .select(NOTIFICATION_DELIVERY_SELECT)
    .eq("id", notificationId)
    .maybeSingle()

  if (response.error) {
    throw new Error(notificationsCopy.feedback.loadError)
  }

  const [notification] = normalizeNotificationDeliveries(
    response.data ? [response.data] : []
  )

  if (!notification) {
    throw new Error(notificationsCopy.feedback.notFound)
  }

  return notification
}

async function listExistingNotificationIds(
  supabase: SupabaseBrowserClient,
  notificationIds: readonly string[]
) {
  if (notificationIds.length === 0) {
    return new Set<string>()
  }

  const response = await supabase
    .from("notification_deliveries")
    .select("id")
    .in("id", notificationIds)

  if (response.error) {
    throw new Error(notificationsCopy.feedback.loadError)
  }

  return new Set(normalizeReturnedIds(response.data))
}

function toIsRead(status: NotificationStatus) {
  return status === "read"
}

function createSupabaseNotificationsGateway(): NotificationsGateway {
  return {
    async countUnreadNotifications() {
      const supabase = getSupabaseOrThrow()
      const response = await supabase
        .from("notification_deliveries")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)

      if (response.error) {
        throw new Error(notificationsCopy.feedback.loadError)
      }

      return response.count ?? 0
    },
    async listNotifications() {
      const supabase = getSupabaseOrThrow()
      const response = await supabase
        .from("notification_deliveries")
        .select(NOTIFICATION_DELIVERY_SELECT)
        .order("created_at", { ascending: false })

      if (response.error) {
        throw new Error(notificationsCopy.feedback.loadError)
      }

      return normalizeNotificationDeliveries(response.data)
    },
    async markAllNotificationsAsRead() {
      const supabase = getSupabaseOrThrow()
      const total = await this.countUnreadNotifications()

      if (total === 0) {
        return {
          failed: [],
          total: 0,
          updated: 0,
        }
      }

      const response = await supabase.rpc("set_all_notifications_read_status", {
        is_read: true,
      })

      if (response.error) {
        throw new Error(notificationsCopy.feedback.markAllAsReadError)
      }

      return {
        failed: [],
        total,
        updated: normalizeReturnedIds(response.data).length,
      }
    },
    async setNotificationStatus(notificationId, status) {
      const supabase = getSupabaseOrThrow()
      const response = await supabase.rpc("set_notification_read_status", {
        delivery_id: notificationId,
        is_read: toIsRead(status),
      })

      if (response.error) {
        throw new Error(
          status === "read"
            ? notificationsCopy.feedback.markAsReadError
            : notificationsCopy.feedback.markAsUnreadError
        )
      }

      if (normalizeReturnedIds(response.data).length === 0) {
        throw new Error(notificationsCopy.feedback.notFound)
      }

      return getNotificationById(supabase, notificationId)
    },
    async setNotificationsStatus(notificationIds, status) {
      const supabase = getSupabaseOrThrow()
      const uniqueIds = [...new Set(notificationIds)]

      if (uniqueIds.length === 0) {
        return {
          failed: [],
          total: 0,
          updated: 0,
        }
      }

      const existingIds = await listExistingNotificationIds(supabase, uniqueIds)
      const response = await supabase.rpc("set_notifications_read_status", {
        delivery_ids: uniqueIds,
        is_read: toIsRead(status),
      })

      if (response.error) {
        throw new Error(notificationsCopy.feedback.markAllAsReadError)
      }

      return {
        failed: uniqueIds.filter((notificationId) => !existingIds.has(notificationId)),
        total: uniqueIds.length,
        updated: normalizeReturnedIds(response.data).length,
      }
    },
    subscribeNotifications(listener, options) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        return () => undefined
      }

      const filter = options?.recipientAuthUserId
        ? `recipient_auth_user_id=eq.${options.recipientAuthUserId}`
        : undefined
      const channel = supabase
        .channel(`notification_deliveries:${options?.recipientAuthUserId ?? "current"}`)
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
        void supabase.removeChannel(channel)
      }
    },
  }
}

let notificationsGateway: NotificationsGateway =
  getSupabaseBrowserClient() ? createSupabaseNotificationsGateway() : createEmptyNotificationsGateway()

export function setNotificationsGateway(gateway: NotificationsGateway) {
  notificationsGateway = gateway
}

export function resetNotificationsGateway() {
  notificationsGateway = getSupabaseBrowserClient()
    ? createSupabaseNotificationsGateway()
    : createEmptyNotificationsGateway()
}

export function subscribeNotifications(
  listener: () => void,
  options?: { recipientAuthUserId?: string | null }
) {
  return notificationsGateway.subscribeNotifications(listener, options)
}

export function listNotifications(): Promise<NotificationRecord[]> {
  return notificationsGateway.listNotifications()
}

export function setNotificationStatus(
  notificationId: string,
  status: NotificationStatus
): Promise<NotificationRecord> {
  return notificationsGateway.setNotificationStatus(notificationId, status)
}

export function setNotificationsStatus(
  notificationIds: readonly string[],
  status: NotificationStatus
): Promise<SetNotificationsStatusBatchResult> {
  return notificationsGateway.setNotificationsStatus(notificationIds, status)
}

export function markAllNotificationsAsRead(): Promise<SetNotificationsStatusBatchResult> {
  return notificationsGateway.markAllNotificationsAsRead()
}

export function countUnreadNotifications(): Promise<number> {
  return notificationsGateway.countUnreadNotifications()
}
