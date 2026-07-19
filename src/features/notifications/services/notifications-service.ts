import { getSupabaseBrowserClient } from "@/lib"

import {
  NOTIFICATIONS_FETCH_LIMIT,
  notificationsCopy,
} from "../constants"
import {
  isRawNotificationDeliveryRow,
  isSupabaseMaybeDataErrorResponse,
  isSupabaseMaybeErrorResponse,
  normalizeNotificationDeliveries,
  normalizeReturnedIds,
  type NotificationRecord,
  type NotificationsGateway,
  type NotificationStatus,
  type SetNotificationsStatusBatchResult,
} from "../model"

let configuredGateway: NotificationsGateway | null = null

function createEmptyBatchResult(): SetNotificationsStatusBatchResult {
  return {
    failed: [],
    total: 0,
    updated: 0,
  }
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(notificationsCopy.feedback.unavailableClient)
  }

  return supabase
}

function createSupabaseNotificationsGateway(): NotificationsGateway {
  async function listNotifications() {
    const supabase = getSupabaseOrThrow()
    const response = await supabase
      .from("notification_deliveries")
      .select(
        "id, created_at, read_at, notification_events(created_at, description, href, title, type)"
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(NOTIFICATIONS_FETCH_LIMIT)

    if (response.error) {
      throw new Error(notificationsCopy.feedback.loadError, {
        cause: response.error,
      })
    }

    return normalizeNotificationDeliveries(response.data ?? [])
  }

  async function getNotificationById(notificationId: string) {
    const supabase = getSupabaseOrThrow()
    const response = await supabase
      .from("notification_deliveries")
      .select(
        "id, created_at, read_at, notification_events(created_at, description, href, title, type)"
      )
      .eq("id", notificationId)
      .maybeSingle()

    if (response.error) {
      throw new Error(notificationsCopy.feedback.loadError, {
        cause: response.error,
      })
    }

    const notification = isRawNotificationDeliveryRow(response.data)
      ? normalizeNotificationDeliveries([response.data])[0] ?? null
      : null

    if (!notification) {
      throw new Error(notificationsCopy.feedback.notFound)
    }

    return notification
  }

  async function countUnreadNotifications() {
    const supabase = getSupabaseOrThrow()
    const response = await supabase
      .from("notification_deliveries")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)

    if (response.error) {
      throw new Error(notificationsCopy.feedback.loadError, {
        cause: response.error,
      })
    }

    return response.count ?? 0
  }

  async function setNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ) {
    const supabase = getSupabaseOrThrow()
    const response: unknown = await supabase.rpc("set_notification_read_status", {
      delivery_id: notificationId,
      is_read: status === "read",
    })

    if (isSupabaseMaybeErrorResponse(response) && response.error) {
      const message = status === "read"
        ? notificationsCopy.feedback.markAsReadError
        : notificationsCopy.feedback.markAsUnreadError

      throw new Error(message, { cause: response.error })
    }

    return getNotificationById(notificationId)
  }

  async function markAllNotificationsAsRead() {
    const supabase = getSupabaseOrThrow()
    const response: unknown = await supabase.rpc("set_all_notifications_read_status", {
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
      total: updatedIds.length,
      updated: updatedIds.length,
    }
  }

  async function setNotificationsStatus(
    notificationIds: readonly string[],
    status: NotificationStatus
  ) {
    const uniqueIds = [...new Set(notificationIds)]

    if (uniqueIds.length === 0) {
      return createEmptyBatchResult()
    }

    const supabase = getSupabaseOrThrow()
    const response: unknown = await supabase.rpc("set_notifications_read_status", {
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
    const supabase = getSupabaseOrThrow()
    const recipientAuthUserId = options.recipientAuthUserId ?? null
    const filter = recipientAuthUserId
      ? `recipient_auth_user_id=eq.${recipientAuthUserId}`
      : undefined
    const channelName = recipientAuthUserId
      ? `notification-deliveries:${recipientAuthUserId}`
      : "notification-deliveries"
    const channel = supabase
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
      void supabase.removeChannel(channel)
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
