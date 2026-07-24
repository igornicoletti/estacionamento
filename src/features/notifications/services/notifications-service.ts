import {
  type NotificationRecord,
  type NotificationStatus,
} from "../types/notifications-types"

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

let inMemoryNotifications = [...initialNotifications]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function subscribeNotifications(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export async function listNotifications(): Promise<NotificationRecord[]> {
  await Promise.resolve()
  return [...inMemoryNotifications]
}

export async function setNotificationStatus(
  notificationId: string,
  status: NotificationStatus
): Promise<NotificationRecord> {
  await Promise.resolve()

  const currentNotification = inMemoryNotifications.find(
    (notification) => notification.id === notificationId
  )

  if (!currentNotification) {
    throw new Error("Notificação não encontrada.")
  }

  const updatedNotification: NotificationRecord = {
    ...currentNotification,
    status,
  }

  inMemoryNotifications = inMemoryNotifications.map((notification) =>
    notification.id === notificationId ? updatedNotification : notification
  )

  emitChange()

  return updatedNotification
}

export async function countUnreadNotifications(): Promise<number> {
  await Promise.resolve()

  return inMemoryNotifications.filter((notification) => notification.status === "unread")
    .length
}
