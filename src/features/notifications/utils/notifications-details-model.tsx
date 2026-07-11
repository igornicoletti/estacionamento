import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { formatDateTime } from "@/lib"

import { notificationsCopy } from "../notifications-copy"
import {
  notificationStatusLabels,
  notificationTypeLabels,
  type NotificationRecord,
} from "../types/notifications-types"

function renderDestination(notification: NotificationRecord) {
  if (!notification.href) {
    return notificationsCopy.details.emptyDestination
  }

  return (
    <span className="break-all font-mono text-xs">
      {notification.href}
    </span>
  )
}

export function getNotificationDetailItems(
  notification: NotificationRecord
): AppDetailsSheetItem[] {
  return [
    {
      id: "type",
      label: notificationsCopy.details.type,
      value: notificationTypeLabels[notification.type],
    },
    {
      id: "status",
      label: notificationsCopy.details.status,
      value: notificationStatusLabels[notification.status],
    },
    {
      id: "date",
      label: notificationsCopy.details.date,
      value: formatDateTime(notification.occurredAt),
    },
    {
      id: "destination",
      label: notificationsCopy.details.destination,
      value: renderDestination(notification),
    },
  ]
}

export function resolveNotificationDetailsTitle(
  notification: NotificationRecord | null
) {
  return notification?.title ?? notificationsCopy.details.titleFallback
}

export function resolveNotificationDetailsDescription(
  notification: NotificationRecord | null
) {
  return notification?.description
}
