import * as React from "react"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { notify } from "@/components/toast"
import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { Button } from "@/components/ui/button"

import { createNotificationsColumns } from "../table"
import { useNotifications } from "../context"
import {
  notificationStatusLabels,
  notificationsCopy,
  notificationTypeLabels,
} from "../constants"
import {
  getNotificationDetailItems,
  resolveNotificationDetailsDescription,
  resolveNotificationDetailsTitle,
  type NotificationRecord,
  type NotificationStatus,
} from "../model"

export function NotificationsRoute() {
  const {
    data,
    error,
    isLoading,
    isNotificationUpdating,
    isUpdatingBatch,
    markAllAsRead,
    unreadCount,
    updateStatus,
  } = useNotifications()
  const [selectedNotification, setSelectedNotification] =
    React.useState<NotificationRecord | null>(null)

  const selectedNotificationItems = React.useMemo(
    () =>
      selectedNotification
        ? getNotificationDetailItems(selectedNotification)
        : [],
    [selectedNotification]
  )

  const handleStatusChange = React.useCallback(
    async (notification: NotificationRecord, status: NotificationStatus) => {
      try {
        await updateStatus(notification.id, status)
      } catch {
        notify.error(
          status === "read"
            ? notificationsCopy.feedback.markAsReadError
            : notificationsCopy.feedback.markAsUnreadError
        )
      }
    },
    [updateStatus]
  )

  const handleMarkAllAsRead = React.useCallback(async () => {
    try {
      await markAllAsRead()
    } catch {
      notify.error(notificationsCopy.feedback.markAllAsReadError)
    }
  }, [markAllAsRead])

  const columns = React.useMemo(
    () =>
      createNotificationsColumns({
        isNotificationUpdating,
        onMarkAsRead: (notification) => {
          void handleStatusChange(notification, "read")
        },
        onMarkAsUnread: (notification) => {
          void handleStatusChange(notification, "unread")
        },
        onOpenDetails: (notification) => {
          setSelectedNotification(notification)
        },
      }),
    [handleStatusChange, isNotificationUpdating]
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
          placeholder: notificationsCopy.filters.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "type",
            title: notificationsCopy.filters.type,
            options: typeOptions,
          },
          {
            id: "status",
            title: notificationsCopy.filters.status,
            options: statusOptions,
          },
        ]}
        toolbarActions={
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isUpdatingBatch || unreadCount === 0}
            aria-busy={isUpdatingBatch || undefined}
            onClick={() => {
              void handleMarkAllAsRead()
            }}
          >
            {isUpdatingBatch
              ? notificationsCopy.actions.updatingAll
              : notificationsCopy.actions.markAllAsRead}
          </Button>
        }
        isLoading={isLoading}
        error={error}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={selectedNotification !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null)
        }}
        title={resolveNotificationDetailsTitle(selectedNotification)}
        description={resolveNotificationDetailsDescription(selectedNotification)}
        items={selectedNotificationItems}
      />
    </div>
  )
}
