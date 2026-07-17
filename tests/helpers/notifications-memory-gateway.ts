import {
  type NotificationRecord,
  type NotificationsGateway,
} from "@/features/notifications"

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
