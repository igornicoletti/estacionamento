import { BellIcon } from "lucide-react"
import * as React from "react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppSheet } from "@/components/shared/app-sheet"
import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib"

import { createNotificationsColumns } from "../columns/notifications-columns"
import { useNotifications } from "../context"
import { notificationsCopy } from "../notifications-copy"
import {
  notificationStatusLabels,
  notificationTypeLabels,
  type NotificationRecord,
} from "../types/notifications-types"

const NOTIFICATIONS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.notifications.columns.v2"

export function NotificationsRoute() {
  const {
    data,
    unreadCount,
    error,
    isLoading,
    isUpdatingBatch,
    refetch,
    updateStatus,
    markAllAsRead,
  } = useNotifications()
  const [selectedNotification, setSelectedNotification] =
    React.useState<NotificationRecord | null>(null)

  const handleMarkAllAsRead = React.useCallback(async () => {
    try {
      const result = await markAllAsRead()

      if (result.failed.length > 0) {
        notify.error(notificationsCopy.feedback.markAllAsReadError)
      }
    } catch {
      notify.error(notificationsCopy.feedback.markAllAsReadError)
    }
  }, [markAllAsRead])

  const columns = React.useMemo(
    () =>
      createNotificationsColumns({
        onOpenDetails: setSelectedNotification,
        onMarkAsRead: (notification) => {
          void updateStatus(notification.id, "read").catch(() => {
            notify.error(notificationsCopy.feedback.markAsReadError)
          })
        },
        onMarkAsUnread: (notification) => {
          void updateStatus(notification.id, "unread").catch(() => {
            notify.error(notificationsCopy.feedback.markAsUnreadError)
          })
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
        subtitle={`${notificationsCopy.page.subtitle} ${notificationsCopy.page.unreadCounter(unreadCount)}.`}
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
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        emptyState={(
          <AppEmptyState
            media={<BellIcon />}
            title={notificationsCopy.empty.allTitle}
            description={notificationsCopy.empty.allDescription}
          />
        )}
        enablePagination
        enableViewOptions
      />

      <AppSheet
        open={Boolean(selectedNotification)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null)
          }
        }}
        title={selectedNotification?.title ?? notificationsCopy.details.titleFallback}
        description={selectedNotification?.description}
      >
        {selectedNotification ? (
          <dl className="grid gap-4 text-sm">
            <div className="grid gap-1">
              <dt className="font-medium">{notificationsCopy.details.type}</dt>
              <dd className="text-muted-foreground">
                {notificationTypeLabels[selectedNotification.type]}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium">{notificationsCopy.details.status}</dt>
              <dd className="text-muted-foreground">
                {notificationStatusLabels[selectedNotification.status]}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium">{notificationsCopy.details.date}</dt>
              <dd className="text-muted-foreground">
                {formatDateTime(selectedNotification.occurredAt)}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium">{notificationsCopy.details.destination}</dt>
              <dd className="break-all text-muted-foreground">
                {selectedNotification.href ?? notificationsCopy.details.emptyDestination}
              </dd>
            </div>
          </dl>
        ) : null}
      </AppSheet>
    </PageSection>
  )
}
