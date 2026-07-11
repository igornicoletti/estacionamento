import { type NotificationRecord } from "../types/notifications-types"

const DEFAULT_RECENT_NOTIFICATIONS_LIMIT = 6
const MAX_COUNTER_VALUE = 99

export function isUnreadNotification(notification: NotificationRecord) {
  return notification.status === "unread"
}

export function getUnreadNotifications(
  notifications: readonly NotificationRecord[]
) {
  return notifications.filter(isUnreadNotification)
}

export function getUnreadNotificationsCount(
  notifications: readonly NotificationRecord[]
) {
  return getUnreadNotifications(notifications).length
}

export function getRecentUnreadNotifications(
  notifications: readonly NotificationRecord[],
  options: { limit?: number } = {}
) {
  const limit = options.limit ?? DEFAULT_RECENT_NOTIFICATIONS_LIMIT

  return getUnreadNotifications(notifications).slice(0, limit)
}

export function formatNotificationsCounter(count: number) {
  if (count <= 0) {
    return null
  }

  return count > MAX_COUNTER_VALUE ? `+${MAX_COUNTER_VALUE}` : String(count)
}

export function isInternalNotificationHref(
  href: string | null | undefined
): href is `/${string}` {
  return Boolean(href && href.startsWith("/") && !href.startsWith("//"))
}
