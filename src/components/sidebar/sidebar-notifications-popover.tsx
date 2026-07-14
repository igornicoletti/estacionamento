import { BellIcon, RefreshCcw } from "lucide-react"
import * as React from "react"
import { Link } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  isInternalNotificationHref,
} from "@/features/notifications/utils/notifications-rules"
import { formatDateTime } from "@/lib"

import { sidebarCopy } from "./sidebar-copy"

function resolveNotificationHref(href: string | undefined) {
  return isInternalNotificationHref(href) ? href : appRoutePaths.notifications
}

function resolveNotificationButtonLabel(unreadCount: number) {
  if (unreadCount <= 0) {
    return sidebarCopy.notifications.open
  }

  return `${sidebarCopy.notifications.open}. ${notificationsCopy.page.unreadCounter(unreadCount)}.`
}

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = React.useState(false)
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

  const handleRetry = React.useCallback(() => {
    void refetch()
  }, [refetch])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={resolveNotificationButtonLabel(unreadCount)}
        >
          <BellIcon />
          {unreadBadge ? (
            <Badge
              variant="destructive"
              aria-live="polite"
              className="absolute -top-1 -right-1 h-5 min-w-5 justify-center bg-destructive px-1 text-[0.625rem] font-bold leading-none text-destructive-foreground"
            >
              {unreadBadge}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="max-h-[min(32rem,calc(100svh-5rem))] w-[min(24rem,calc(100vw-2rem))] overflow-hidden p-0"
      >
        {error ? (
          <AppEmptyState
            className="min-h-64 rounded-lg border-0 bg-muted/30"
            media={<RefreshCcw />}
            title={notificationsCopy.feedback.loadError}
            actions={(
              <Button type="button" variant="secondary" onClick={handleRetry}>
                {notificationsCopy.actions.retry}
              </Button>
            )}
          />
        ) : recentNotifications.length === 0 ? (
          <AppEmptyState
            className="min-h-64 rounded-lg border-0 bg-muted/30"
            media={<BellIcon />}
            title={notificationsCopy.empty.unreadTitle}
            description={notificationsCopy.empty.unreadDescription}
          />
        ) : (
          <div className="flex max-h-[inherit] min-h-0 flex-col gap-2 p-2.5">
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

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-1">
                {recentNotifications.map((notification) => {
                  const isUpdating = isNotificationUpdating(notification.id)

                  return (
                    <Button
                      key={notification.id}
                      asChild
                      variant="ghost"
                      className="h-auto justify-start px-2 py-2 text-left"
                    >
                      <Link
                        to={resolveNotificationHref(notification.href)}
                        aria-busy={isUpdating}
                        onClick={() => {
                          setIsOpen(false)

                          if (notification.status === "unread" && !isUpdating) {
                            void updateStatus(notification.id, "read").catch(() => {
                              notify.error(notificationsCopy.feedback.markAsReadError)
                            })
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
                  )
                })}
              </div>
            </div>

            <Button
              asChild
              variant="secondary"
              className="w-full shrink-0"
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
