import type * as React from "react"

export type HeaderNotificationType = "system" | "security" | "sync"
export type HeaderNotificationStatus = "unread" | "read"

export type HeaderNotification = {
  id: string
  title: string
  description: string
  occurredAt: string
  type: HeaderNotificationType
  status: HeaderNotificationStatus
  href?: `/${string}`
}

export type NotificationsController = {
  data: readonly HeaderNotification[]
  error: Error | null
  isLoading: boolean
  isRefreshing: boolean
  isUpdatingBatch: boolean
  unreadCount: number
  markAllAsRead: () => unknown
  refetch: () => Promise<void>
  updateStatus: (
    notificationId: string,
    status: HeaderNotificationStatus
  ) => unknown
}

export type NotificationsPopoverItem = HeaderNotification & {
  href: `/${string}`
  typeLabel: string
}

export type NotificationsPopoverLabels = {
  open: string
  openWithUnread: (count: number) => string
  title: string
  markAllRead: string
  updatingAll: string
  loading: string
  errorTitle: string
  errorDescription: string
  retry: string
  emptyTitle: string
  emptyDescription: string
  unread: string
  viewAll: string
}

export type NotificationLinkRenderProps = {
  children: React.ReactNode
  onClick: React.MouseEventHandler<HTMLAnchorElement>
  "aria-label"?: string
}
