import { CheckCheckIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"

import { NotificationsEmptyState } from "../components"
import {
  NOTIFICATIONS_TABLE_COLUMN_VISIBILITY_KEY,
  notificationsCopy,
} from "../constants"
import { useNotifications } from "../context"
import { useNotificationsTableFilters } from "../hooks"
import {
  getNotificationDetailItems,
  resolveNotificationDetailsDescription,
  resolveNotificationDetailsTitle,
  type NotificationRecord,
} from "../model"
import { createNotificationsColumns } from "../table"

export function NotificationsRoute() {
  const {
    data,
    error,
    isLoading,
    isNotificationUpdating,
    isUpdatingBatch,
    markAllAsRead,
    refetch,
    unreadCount,
    updateStatus,
  } = useNotifications()
  const [selectedNotification, setSelectedNotification] =
    React.useState<NotificationRecord | null>(null)
  const filterFields = useNotificationsTableFilters(data)

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
        onOpenDetails: setSelectedNotification,
      }),
    [isNotificationUpdating, updateStatus]
  )

  return (
    <PageSection>
      <PageHeader
        title={notificationsCopy.page.title}
        subtitle={`${notificationsCopy.page.subtitle} ${notificationsCopy.page.unreadCounter(unreadCount)}.`}
        actions={(
          unreadCount > 0 ? (
            <PageHeaderActions>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isLoading || isUpdatingBatch}
                onClick={() => {
                  void handleMarkAllAsRead()
                }}
              >
                <CheckCheckIcon aria-hidden="true" />
                {isUpdatingBatch
                  ? notificationsCopy.actions.updatingAll
                  : notificationsCopy.actions.markAllAsRead}
              </Button>
            </PageHeaderActions>
          ) : null
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
        filterFields={filterFields}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        emptyState={<NotificationsEmptyState />}
        filteredEmptyState={<NotificationsEmptyState variant="filtered" />}
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
