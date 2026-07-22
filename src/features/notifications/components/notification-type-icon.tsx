import {
  InfoIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { type NotificationType } from "../model"

type NotificationTypeIconConfig = {
  Icon: LucideIcon
  className: string
}

const notificationTypeIconConfig: Record<
  NotificationType,
  NotificationTypeIconConfig
> = {
  security: {
    Icon: ShieldCheckIcon,
    className: "bg-warning/10 text-warning dark:bg-warning/20",
  },
  sync: {
    Icon: RefreshCcwIcon,
    className: "bg-info/10 text-info dark:bg-info/20",
  },
  system: {
    Icon: InfoIcon,
    className: "bg-muted text-muted-foreground",
  },
}

interface NotificationTypeIconProps {
  type: NotificationType
  className?: string
}

export function NotificationTypeIcon({
  className,
  type,
}: NotificationTypeIconProps) {
  const config = notificationTypeIconConfig[type]
  const Icon = config.Icon

  return (
    <span
      aria-hidden="true"
      data-notification-type-icon={type}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md",
        config.className,
        className
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}
