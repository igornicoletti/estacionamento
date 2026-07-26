import {
  type NotificationRecord,
  type NotificationsGateway,
  type NotificationStatus,
  type SetNotificationsStatusBatchResult,
} from "../model"

const initialNotifications: NotificationRecord[] = [
  {
    id: "N-001",
    title: "Sincronização concluída",
    description: "Clientes e unidades foram sincronizados com sucesso.",
    type: "sync",
    status: "unread",
    occurredAt: "2026-07-01 08:25",
    href: "/clientes",
  },
  {
    id: "N-002",
    title: "Nova tentativa de acesso",
    description: "Uma nova tentativa de login foi registrada para seu usuário.",
    type: "security",
    status: "unread",
    occurredAt: "2026-07-01 07:58",
    href: "/perfil",
  },
  {
    id: "N-003",
    title: "Atualização aplicada",
    description: "Nova versão do painel foi publicada com melhorias de desempenho.",
    type: "system",
    status: "read",
    occurredAt: "2026-06-30 19:10",
  },
]

function createMemoryNotificationsGateway(
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

      const updatedNotification: NotificationRecord = {
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
      const uniqueIds = Array.from(new Set(notificationIds))
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

      if (updated > 0) emitChange()

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

let notificationsGateway: NotificationsGateway =
  createMemoryNotificationsGateway(initialNotifications)

export function setNotificationsGateway(gateway: NotificationsGateway) {
  notificationsGateway = gateway
}

export function resetNotificationsGateway() {
  notificationsGateway = createMemoryNotificationsGateway(initialNotifications)
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
