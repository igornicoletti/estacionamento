import { BellIcon } from "lucide-react"

import { AppEmptyState } from "@/components/shared/app-empty-state"

import { notificationsCopy } from "../constants"

interface NotificationsEmptyStateProps {
  variant?: "all" | "filtered"
}

export function NotificationsEmptyState({
  variant = "all",
}: NotificationsEmptyStateProps) {
  const copy = variant === "filtered"
    ? {
        description: notificationsCopy.empty.filteredDescription,
        title: notificationsCopy.empty.filteredTitle,
      }
    : {
        description: notificationsCopy.empty.allDescription,
        title: notificationsCopy.empty.allTitle,
      }

  return (
    <AppEmptyState
      media={<BellIcon />}
      title={copy.title}
      description={copy.description}
    />
  )
}
