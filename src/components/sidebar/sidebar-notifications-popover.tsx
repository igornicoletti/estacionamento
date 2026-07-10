import { BellIcon } from "lucide-react"
import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { notify } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  notificationTypeLabels,
  notificationsCopy,
  useNotifications,
} from "@/features/notifications"
import {
  formatNotificationsCounter,
  getRecentUnreadNotifications,
} from "@/features/notifications/utils/notifications-rules"
import { formatDateTime } from "@/lib"

import { sidebarCopy } from "./sidebar-copy"

function resolveNotificationHref(href: string | undefined) {
  return href || appRoutePaths.notifications
}

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = React.useState(false)
  const {
    data,
    unreadCount,
    isLoading,
    isUpdatingBatch,
    updateStatus,
    markAllAsRead,
  } = useNotifications()
  const unreadBadge = formatNotificationsCounter(unreadCount)

  const recentNotifications = React.useMemo(
    () => getRecentUnreadNotifications(data),
    [data]
  )

  const handleMarkAllAsRead = React.useCallback(async () => {
    if (isUpdatingBatch || unreadCount === 0) {
      return
    }

    try {
      const result = await markAllAsRead()

      if (result.failed.length > 0) {
        notify.error(notificationsCopy.feedback.markAllAsReadError)
      }
    } catch {
      notify.error(notificationsCopy.feedback.markAllAsReadError)
    }
  }, [isUpdatingBatch, markAllAsRead, unreadCount])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={sidebarCopy.notifications.open}
        >
          <BellIcon />
          {unreadBadge ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1 text-[0.625rem] font-bold leading-none"
            >
              {unreadBadge}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-0" align="end">
        {recentNotifications.length === 0 ? (
          <Empty className="h-64 rounded-lg border-0 bg-muted/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellIcon />
              </EmptyMedia>
              <EmptyTitle>{notificationsCopy.empty.unreadTitle}</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                {notificationsCopy.empty.unreadDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2 p-2.5">
            <PopoverHeader className="flex-row items-center justify-between gap-2">
              <PopoverTitle>{sidebarCopy.notifications.panelTitle}</PopoverTitle>
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading || isUpdatingBatch || unreadCount === 0}
                aria-label={sidebarCopy.notifications.markAllRead}
                onClick={() => {
                  void handleMarkAllAsRead()
                }}
              >
                {isUpdatingBatch
                  ? notificationsCopy.actions.updatingAll
                  : notificationsCopy.actions.markAllAsRead}
              </Button>
            </PopoverHeader>

            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {recentNotifications.map((notification) => (
                <Button
                  key={notification.id}
                  asChild
                  variant="ghost"
                  className="h-auto justify-start px-2 py-2 text-left"
                >
                  <Link
                    to={resolveNotificationHref(notification.href)}
                    onClick={() => {
                      setIsOpen(false)
                      if (notification.status === "unread") {
                        void updateStatus(notification.id, "read")
                      }
                    }}
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {notification.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDateTime(notification.occurredAt)}
                          </span>
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.description}
                        </span>
                        <span className="text-[0.6875rem] text-muted-foreground">
                          {notificationTypeLabels[notification.type]}
                        </span>
                      </span>
                    </span>
                  </Link>
                </Button>
              ))}
            </div>

            <Button
              asChild
              variant="secondary"
              className="w-full"
              onClick={() => {
                setIsOpen(false)
              }}
            >
              <Link to={appRoutePaths.notifications}>{sidebarCopy.notifications.viewAll}</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
