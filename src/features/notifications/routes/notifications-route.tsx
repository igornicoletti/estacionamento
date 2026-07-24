import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"

import { createNotificationsColumns } from "../columns/notifications-columns"
import { useNotifications } from "../hooks/use-notifications"
import {
  notificationStatusLabels,
  notificationTypeLabels,
} from "../types/notifications-types"

export function NotificationsRoute() {
  const { data, error, isLoading, updateStatus } = useNotifications()

  const columns = React.useMemo(
    () =>
      createNotificationsColumns({
        onMarkAsRead: (notification) => {
          void updateStatus(notification.id, "read")
        },
        onMarkAsUnread: (notification) => {
          void updateStatus(notification.id, "unread")
        },
      }),
    [updateStatus]
  )

  const typeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (notification) => notification.type,
        (notification) => notificationTypeLabels[notification.type]
      ),
    [data]
  )

  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (notification) => notification.status,
        (notification) => notificationStatusLabels[notification.status]
      ),
    [data]
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe alertas de sistema, sincronização e segurança.
        </p>
      </header>

      <DataTable
        columns={columns}
        data={data}
        getRowId={(notification) => notification.id}
        globalSearch={{
          columnIds: [
            "id",
            "title",
            "description",
            "type",
            "status",
            "occurredAt",
            "href",
          ],
          placeholder: "Buscar notificações...",
        }}
        filterFields={[
          {
            id: "type",
            title: "Tipos",
            options: typeOptions,
          },
          {
            id: "status",
            title: "Status",
            options: statusOptions,
          },
        ]}
        isLoading={isLoading}
        error={error}
        enablePagination
        enableViewOptions
      />
    </div>
  )
}
