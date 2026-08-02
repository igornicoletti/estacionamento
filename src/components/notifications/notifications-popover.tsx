import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import {
  notificationTypeLabels,
  useNotifications,
} from "@/features/notifications"
import { formatDateTime } from "@/lib"

import { notificationsCopy } from "./notifications-copy"
import { NotificationsPopoverView } from "./notifications-popover-view"
import type {
  NotificationsController,
  NotificationsPopoverItem,
} from "./notifications.types"
import { normalizeNotificationLimit } from "./notifications-utils"

export type NotificationsPopoverControllerProps = {
  controller: NotificationsController
  maxItems?: number
}

export function NotificationsPopoverController({
  controller,
  maxItems,
}: NotificationsPopoverControllerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const limit = normalizeNotificationLimit(maxItems)

  const items = React.useMemo<readonly NotificationsPopoverItem[]>(
    () =>
      controller.data.slice(0, limit).map((notification) => ({
        ...notification,
        href: notification.href ?? appRoutePaths.notifications,
        typeLabel:
          notificationTypeLabels[notification.type] ?? notification.type,
      })),
    [controller.data, limit]
  )

  return (
    <NotificationsPopoverView
      open={isOpen}
      onOpenChange={setIsOpen}
      items={items}
      unreadCount={controller.unreadCount}
      isLoading={controller.isLoading}
      isRefreshing={controller.isRefreshing}
      isUpdatingBatch={controller.isUpdatingBatch}
      error={controller.error}
      labels={notificationsCopy}
      formatDateTime={formatDateTime}
      onMarkAllRead={controller.markAllAsRead}
      onRetry={controller.refetch}
      onSelectItem={(notification) => {
        if (notification.status === "unread") {
          return controller.updateStatus(notification.id, "read")
        }
      }}
      renderItemLink={(notification, props) => (
        <Link to={notification.href} {...props} />
      )}
      renderViewAllLink={(props) => (
        <Link to={appRoutePaths.notifications} {...props} />
      )}
    />
  )
}

export type NotificationsPopoverProps = {
  maxItems?: number
}

export function NotificationsPopover({
  maxItems,
}: NotificationsPopoverProps = {}) {
  const controller = useNotifications()

  return (
    <NotificationsPopoverController
      controller={controller}
      {...(maxItems === undefined ? {} : { maxItems })}
    />
  )
}
