import { BellIcon } from "lucide-react"
import * as React from "react"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"

import { createNotificationsColumns } from "../columns/notifications-columns"
import { useNotifications } from "../context/notifications-provider"
import { notificationsCopy } from "../notifications-copy"
import {
  notificationStatusLabels,
  notificationTypeLabels,
  type NotificationRecord,
} from "../types/notifications-types"
import {
  getNotificationDetailItems,
  resolveNotificationDetailsDescription,
  resolveNotificationDetailsTitle,
} from "../utils/notifications-details-model"

const NOTIFICATIONS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.notifications.columns.v3"

export function NotificationsRoute() {
  const {
    data,
    unreadCount,
    error,
    isLoading,
    isUpdatingBatch,
    isNotificationUpdating,
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
        isNotificationUpdating,
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
    [isNotificationUpdating, updateStatus]
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

      <AppDetailsSheet
        open={Boolean(selectedNotification)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNotification(null)
          }
        }}
        title={resolveNotificationDetailsTitle(selectedNotification)}
        description={resolveNotificationDetailsDescription(selectedNotification)}
        items={selectedNotification ? getNotificationDetailItems(selectedNotification) : []}
      />
    </PageSection>
  )
}
