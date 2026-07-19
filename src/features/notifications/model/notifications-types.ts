export const notificationTypeValues = [
  "system",
  "security",
  "sync",
] as const

export type NotificationType = (typeof notificationTypeValues)[number]

export const notificationStatusValues = [
  "unread",
  "read",
] as const

export type NotificationStatus = (typeof notificationStatusValues)[number]

export interface NotificationRecord {
  id: string
  title: string
  description: string
  type: NotificationType
  status: NotificationStatus
  occurredAt: string
  href?: `/${string}`
}

export interface NotificationEventRelation {
  created_at: string
  description: string
  href: string | null
  title: string
  type: string
}

export interface RawNotificationDeliveryRow {
  id: string
  created_at: string
  read_at: string | null
  notification_events: NotificationEventRelation | NotificationEventRelation[] | null
}

export interface ReturnedIdRow {
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
