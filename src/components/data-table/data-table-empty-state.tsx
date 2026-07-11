import * as React from "react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

interface DataTableEmptyStateProps {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  actionLabel?: React.ReactNode
  actionIcon?: React.ReactNode
  onAction?: () => void
}

export function DataTableEmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionIcon,
  onAction,
}: DataTableEmptyStateProps) {
  const shouldRenderAction = Boolean(actionLabel && onAction)

  return (
    <AppEmptyState
      media={icon}
      title={title}
      description={description}
      actions={
        shouldRenderAction ? (
          <Button type="button" variant="secondary" size="lg" onClick={onAction}>
            {actionIcon}
            {actionLabel}
          </Button>
        ) : null
      }
    />
  )
}
