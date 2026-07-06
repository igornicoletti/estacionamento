import * as React from "react"

interface DataTableStackedCellProps {
  primary: React.ReactNode
  secondary?: React.ReactNode
  primaryClassName?: string
  secondaryClassName?: string
}

function hasRenderableValue(value: React.ReactNode) {
  return value !== undefined && value !== null && value !== ""
}

export function DataTableStackedCell({
  primary,
  secondary,
  primaryClassName = "font-medium",
  secondaryClassName = "text-xs text-muted-foreground",
}: DataTableStackedCellProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={primaryClassName}>{primary}</span>
      {hasRenderableValue(secondary) ? (
        <span className={secondaryClassName}>{secondary}</span>
      ) : null}
    </div>
  )
}
