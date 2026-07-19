import * as React from "react"

import { type DataTableFilterField } from "@/components/data-table"

import { notificationsCopy } from "../constants"
import { type NotificationRecord } from "../model"
import {
  createNotificationStatusOptions,
  createNotificationTypeOptions,
} from "../table"

export function useNotificationsTableFilters(
  data: readonly NotificationRecord[]
) {
  const typeOptions = React.useMemo(
    () => createNotificationTypeOptions(data),
    [data]
  )
  const statusOptions = React.useMemo(
    () => createNotificationStatusOptions(data),
    [data]
  )

  return React.useMemo(
    () => [
      {
        id: "type",
        options: typeOptions,
        title: notificationsCopy.filters.type,
      },
      {
        id: "status",
        options: statusOptions,
        title: notificationsCopy.filters.status,
      },
    ],
    [statusOptions, typeOptions]
  ) satisfies readonly DataTableFilterField<NotificationRecord>[]
}
