import { BellIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { Link } from "react-router"

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
import { notificationTypeLabels, useNotifications } from "@/features/notifications"

function formatNotificationCount(count: number) {
  if (count === 0) {
    return null
  }

  return count > 99 ? "+99" : String(count)
}

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = React.useState(false)
  const { data, unreadCount, isLoading, refetch, updateStatus } = useNotifications()
  const unreadBadge = formatNotificationCount(unreadCount)

  const recentNotifications = React.useMemo(() => data.slice(0, 6), [data])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label="Abrir notificações"
        >
          <BellIcon />
          {unreadBadge ? (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1 text-[0.625rem] font-bold leading-none bg-primary text-primary-foreground">
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
              <EmptyTitle>Sem notificações</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                Tudo certo por aqui. Novas notificações aparecerão neste painel.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2 p-2.5">
            <PopoverHeader className="flex-row items-center justify-between gap-2">
              <PopoverTitle>Notificações</PopoverTitle>
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={() => {
                  void refetch()
                }}
              >
                <RefreshCcwIcon aria-hidden="true" />
                Sincronizar
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
                    to={notification.href || "/notificacoes"}
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
                        className={
                          notification.status === "unread"
                            ? "mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                            : "mt-1.5 size-2 shrink-0 rounded-full bg-muted"
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {notification.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {notification.occurredAt}
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
              <Link to="/notificacoes">Ver todas</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
