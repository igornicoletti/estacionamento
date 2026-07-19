import { createDataTableFilterOptions } from "@/components/data-table"

import {
  notificationStatusLabels,
  notificationTypeLabels,
} from "../constants"
import { type NotificationRecord } from "../model"

export function createNotificationTypeOptions(
  data: readonly NotificationRecord[]
) {
  return createDataTableFilterOptions(
    data,
    (notification) => notification.type,
    (notification) => notificationTypeLabels[notification.type]
  )
}

export function createNotificationStatusOptions(
  data: readonly NotificationRecord[]
) {
  return createDataTableFilterOptions(
    data,
    (notification) => notification.status,
    (notification) => notificationStatusLabels[notification.status]
  )
}
