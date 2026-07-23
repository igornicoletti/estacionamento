import * as React from "react"

import { cn } from "@/lib/utils"

export interface DataTableStackedCellProps {
  primary: React.ReactNode
  secondary?: React.ReactNode
  primaryFallback?: React.ReactNode
  className?: string
  primaryClassName?: string
  secondaryClassName?: string
}

function hasRenderableValue(
  value: React.ReactNode
): boolean {
  const nodes = React.Children.toArray(value)

  return nodes.some((node) => {
    if (typeof node === "string") {
      return node.trim().length > 0
    }

    return true
  })
}

export function DataTableStackedCell({
  primary,
  secondary,
  primaryFallback = "—",
  className,
  primaryClassName,
  secondaryClassName,
}: DataTableStackedCellProps) {
  const resolvedPrimary = hasRenderableValue(primary)
    ? primary
    : primaryFallback

  const hasPrimary =
    hasRenderableValue(resolvedPrimary)

  const hasSecondary =
    hasRenderableValue(secondary)

  if (!hasPrimary && !hasSecondary) {
    return null
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        className
      )}
    >
      {hasPrimary ? (
        <div
          className={cn(
            "min-w-0 font-medium",
            primaryClassName
          )}
        >
          {resolvedPrimary}
        </div>
      ) : null}

      {hasSecondary ? (
        <div
          className={cn(
            "min-w-0 text-xs text-muted-foreground",
            secondaryClassName
          )}
        >
          {secondary}
        </div>
      ) : null}
    </div>
  )
}
