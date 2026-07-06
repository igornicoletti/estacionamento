import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface DataTableEmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
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
    <Empty>
      <EmptyHeader>
        {icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {shouldRenderAction ? (
        <EmptyContent>
          <Button type="button" variant="secondary" onClick={onAction}>
            {actionIcon}
            {actionLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
