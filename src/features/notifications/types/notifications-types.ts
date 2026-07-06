export const notificationTypeValues = [
  "system",
  "security",
  "sync",
] as const

export type NotificationType = (typeof notificationTypeValues)[number]

export const notificationTypeLabels: Record<NotificationType, string> = {
  security: "Segurança",
  sync: "Sincronização",
  system: "Sistema",
}

export const notificationStatusValues = [
  "unread",
  "read",
] as const

export type NotificationStatus = (typeof notificationStatusValues)[number]

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  read: "Lida",
  unread: "Não lida",
}

export interface NotificationRecord {
  id: string
  title: string
  description: string
  type: NotificationType
  status: NotificationStatus
  occurredAt: string
  href?: `/${string}`
}
