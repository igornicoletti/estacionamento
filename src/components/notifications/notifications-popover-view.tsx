import type * as React from "react"

import {
  BellIcon,
  CheckCheckIcon,
  RefreshCcwIcon,
  ShieldAlertIcon,
  type LucideIcon,
} from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"

import type {
  NotificationLinkRenderProps,
  NotificationsPopoverItem,
  NotificationsPopoverLabels,
} from "./notifications.types"
import { formatNotificationBadge } from "./notifications-utils"

function getNotificationIcon(type: NotificationsPopoverItem["type"]): LucideIcon {
  if (type === "security") {
    return ShieldAlertIcon
  }

  if (type === "sync") {
    return RefreshCcwIcon
  }

  return BellIcon
}

function NotificationsLoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="grid gap-2 p-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} aria-hidden="true" className="flex items-start gap-2 p-2">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <span className="grid min-w-0 flex-1 gap-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/5" />
          </span>
        </div>
      ))}
    </div>
  )
}

export type NotificationsPopoverViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: readonly NotificationsPopoverItem[]
  unreadCount: number
  isLoading: boolean
  isRefreshing: boolean
  isUpdatingBatch: boolean
  error: Error | null
  labels: NotificationsPopoverLabels
  formatDateTime: (value: string) => string
  onMarkAllRead: () => unknown
  onRetry: () => Promise<void>
  onSelectItem: (item: NotificationsPopoverItem) => unknown
  renderItemLink: (
    item: NotificationsPopoverItem,
    props: NotificationLinkRenderProps
  ) => React.ReactElement
  renderViewAllLink: (props: NotificationLinkRenderProps) => React.ReactElement
}

export function NotificationsPopoverView({
  open,
  onOpenChange,
  items,
  unreadCount,
  isLoading,
  isRefreshing,
  isUpdatingBatch,
  error,
  labels,
  formatDateTime,
  onMarkAllRead,
  onRetry,
  onSelectItem,
  renderItemLink,
  renderViewAllLink,
}: NotificationsPopoverViewProps) {
  const unreadBadge = formatNotificationBadge(unreadCount)
  const triggerLabel =
    unreadCount > 0 ? labels.openWithUnread(unreadCount) : labels.open
  const isBusy = isLoading || isRefreshing || isUpdatingBatch
  const showInitialLoading = isLoading && items.length === 0
  const showBlockingError = Boolean(error) && items.length === 0 && !isLoading

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={triggerLabel}
          aria-busy={isBusy}
        >
          <BellIcon aria-hidden="true" />
          {unreadBadge ? (
            <Badge
              aria-hidden="true"
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1 text-[0.625rem] font-bold leading-none"
            >
              {unreadBadge}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
        aria-busy={isBusy}
      >
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <PopoverHeader>
            <PopoverTitle className="text-base font-semibold">
              {labels.title}
            </PopoverTitle>
          </PopoverHeader>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || unreadCount === 0}
            onClick={() => {
              void onMarkAllRead()
            }}
          >
            <CheckCheckIcon aria-hidden="true" />
            {isUpdatingBatch ? labels.updatingAll : labels.markAllRead}
          </Button>
        </div>

        {showInitialLoading ? (
          <NotificationsLoadingState label={labels.loading} />
        ) : showBlockingError ? (
          <Empty className="h-64 rounded-none border-0 bg-muted/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RefreshCcwIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{labels.errorTitle}</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                {labels.errorDescription}
              </EmptyDescription>
            </EmptyHeader>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                void onRetry()
              }}
            >
              <RefreshCcwIcon aria-hidden="true" />
              {labels.retry}
            </Button>
          </Empty>
        ) : items.length === 0 ? (
          <Empty className="h-64 rounded-none border-0 bg-muted/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                {labels.emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2 p-2.5">
            {error ? (
              <div role="status" className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
                <span>{labels.errorDescription}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => {
                    void onRetry()
                  }}
                >
                  {labels.retry}
                </Button>
              </div>
            ) : null}

            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {items.map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.type)
                const isUnread = notification.status === "unread"
                const link = renderItemLink(notification, {
                  onClick: () => {
                    onOpenChange(false)
                    void onSelectItem(notification)
                  },
                  children: (
                    <span className="flex min-w-0 flex-1 items-start gap-2">
                      <NotificationIcon
                        aria-hidden="true"
                        data-notification-type-icon={notification.type}
                        className={
                          isUnread
                            ? "mt-0.5 size-4 shrink-0 text-primary"
                            : "mt-0.5 size-4 shrink-0 text-muted-foreground"
                        }
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
                          {notification.typeLabel}
                        </span>
                        {isUnread ? (
                          <span className="sr-only">{labels.unread}</span>
                        ) : null}
                      </span>
                    </span>
                  ),
                })

                return (
                  <li key={notification.id}>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-auto w-full justify-start px-2 py-2 text-left"
                    >
                      {link}
                    </Button>
                  </li>
                )
              })}
            </ul>

            <Button asChild variant="secondary" className="w-full">
              {renderViewAllLink({
                onClick: () => onOpenChange(false),
                children: labels.viewAll,
              })}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
