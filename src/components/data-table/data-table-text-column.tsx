import * as React from "react"
import { type ColumnDef, type Row } from "@tanstack/react-table"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { type DataTableColumnId } from "./data-table-types"

interface DataTableTextColumnConfig<TData> {
  accessorKey: DataTableColumnId<TData>
  title: string
  className?: string
  fallback?: React.ReactNode
  formatValue?: (value: unknown, row: Row<TData>) => React.ReactNode
  enableHiding?: boolean
  enableSorting?: boolean
}

function normalizeCellValue(value: unknown, fallback: React.ReactNode) {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    return trimmed.length > 0 ? trimmed : fallback
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return fallback
}

export function createTextColumn<TData>({
  accessorKey,
  title,
  className,
  fallback = "—",
  formatValue,
  enableHiding,
  enableSorting,
}: DataTableTextColumnConfig<TData>): ColumnDef<TData> {
  return {
    accessorKey,
    meta: {
      label: title,
    },
    header: createDataTableColumnHeader<TData, unknown>(title),
    cell: ({ row }) => {
      const rawValue = row.getValue(accessorKey)
      const content = formatValue
        ? formatValue(rawValue, row)
        : normalizeCellValue(rawValue, fallback)

      return className ? <span className={className}>{content}</span> : content
    },
    enableHiding,
    enableSorting,
  }
}
