import * as React from "react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface DataTableEmptyStateProps {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  actionLabel?: string
  actionIcon?: React.ReactNode
  onAction?: () => void
  isActionPending?: boolean
  pendingActionLabel?: string
}

function hasRenderableContent(value: React.ReactNode): boolean {
  return React.Children.toArray(value).length > 0
}

export function DataTableEmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionIcon,
  onAction,
  isActionPending = false,
  pendingActionLabel,
}: DataTableEmptyStateProps) {
  const normalizedActionLabel = actionLabel?.trim() ?? ""
  const canRenderAction = normalizedActionLabel.length > 0 && Boolean(onAction)
  const resolvedActionLabel =
    isActionPending && pendingActionLabel?.trim()
      ? pendingActionLabel.trim()
      : normalizedActionLabel

  return (
    <AppEmptyState
      media={hasRenderableContent(icon) ? icon : undefined}
      title={title}
      description={description}
      actions={
        canRenderAction ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isActionPending}
            aria-busy={isActionPending || undefined}
            onClick={onAction}
          >
            {isActionPending ? (
              <Spinner
                data-icon="inline-start"
                role={undefined}
                aria-label={undefined}
                aria-hidden="true"
                focusable="false"
              />
            ) : hasRenderableContent(actionIcon) ? (
              <span data-icon="inline-start" aria-hidden="true">
                {actionIcon}
              </span>
            ) : null}
            {resolvedActionLabel}
          </Button>
        ) : undefined
      }
    />
  )
}
