import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"

import { createNotificationsColumns } from "../columns/notifications-columns"
import { useNotifications } from "../hooks/use-notifications"
import { notificationsCopy } from "../notifications-copy"
import {
  notificationStatusLabels,
  notificationTypeLabels,
} from "../types/notifications-types"

const NOTIFICATIONS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.notifications.columns.v1"

export function NotificationsRoute() {
  const {
    data,
    unreadCount,
    error,
    isLoading,
    isUpdatingBatch,
    updateStatus,
    markAllAsRead,
  } = useNotifications()

  const handleMarkAllAsRead = React.useCallback(async () => {
    const result = await markAllAsRead()

    if (result.failed.length > 0) {
      notify.error(notificationsCopy.feedback.markAllAsReadError)
    }
  }, [markAllAsRead])

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
    <PageSection>
      <PageHeader
        title={notificationsCopy.page.title}
        subtitle={`${notificationsCopy.page.subtitle} Não lidas: ${unreadCount}.`}
        actions={(
          <PageHeaderActions>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={isLoading || isUpdatingBatch || unreadCount === 0}
              onClick={() => {
                void handleMarkAllAsRead()
              }}
            >
              {isUpdatingBatch
                ? notificationsCopy.actions.updatingAll
                : notificationsCopy.actions.markAllAsRead}
            </Button>
          </PageHeaderActions>
        )}
      />

      <DataTable
        columns={columns}
        data={data}
        columnVisibilityStorageKey={NOTIFICATIONS_TABLE_COLUMN_VISIBILITY_KEY}
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
        emptyState={(
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{notificationsCopy.empty.allTitle}</p>
            <p>{notificationsCopy.empty.allDescription}</p>
          </div>
        )}
        enablePagination
        enableViewOptions
      />
    </PageSection>
  )
}
