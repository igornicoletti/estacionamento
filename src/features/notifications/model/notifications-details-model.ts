import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { formatDateTime } from "@/lib"

import {
  notificationStatusLabels,
  notificationsCopy,
  notificationTypeLabels,
} from "../constants"
import { type NotificationRecord } from "./notifications-types"

function renderDestination(notification: NotificationRecord) {
  return notification.href ?? notificationsCopy.details.emptyDestination
}

export function getNotificationDetailItems(
  notification: NotificationRecord
): readonly AppDetailsSheetItem[] {
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
