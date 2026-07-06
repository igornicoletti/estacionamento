import * as React from "react"
import { type ColumnDef, type Row } from "@tanstack/react-table"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { type DataTableColumnId } from "./data-table-types"

interface DataTableDateTimeColumnConfig<TData> {
  accessorKey: DataTableColumnId<TData>
  title: string
  fallback?: React.ReactNode
  formatValue?: (value: string, row: Row<TData>) => React.ReactNode
  enableHiding?: boolean
  enableSorting?: boolean
}

export function createDateTimeColumn<TData>({
  accessorKey,
  title,
  fallback = "Nunca",
  formatValue,
  enableHiding,
  enableSorting,
}: DataTableDateTimeColumnConfig<TData>): ColumnDef<TData> {
  return {
    accessorKey,
    meta: {
      label: title,
    },
    header: createDataTableColumnHeader<TData, unknown>(title),
    cell: ({ row }) => {
      const value = row.getValue<string | null | undefined>(accessorKey)

      if (!value) {
        return fallback
      }

      return formatValue ? formatValue(value, row) : value
    },
    enableHiding,
    enableSorting,
  }
}
