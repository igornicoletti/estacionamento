import * as React from "react"

import { type DataTableFilterOption } from "./data-table-types"

interface DataTableOptionCellProps {
  options: readonly DataTableFilterOption[]
  value: string
  className?: string
  fallback?: React.ReactNode
}

export function findDataTableFilterOption(
  options: readonly DataTableFilterOption[],
  value: string
) {
  return options.find((option) => option.value === value) ?? null
}

export function DataTableOptionCell({
  options,
  value,
  className = "flex items-center gap-2",
  fallback = null,
}: DataTableOptionCellProps) {
  const option = findDataTableFilterOption(options, value)

  if (!option) {
    return fallback
  }

  return (
    <div className={className}>
      <span>{option.label}</span>
    </div>
  )
}
