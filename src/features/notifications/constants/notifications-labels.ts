import { type NotificationStatus, type NotificationType } from "../model"

export const notificationTypeLabels: Record<NotificationType, string> = {
  security: "Segurança",
  sync: "Sincronização",
  system: "Sistema",
}

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  read: "Lida",
  unread: "Não lida",
}
