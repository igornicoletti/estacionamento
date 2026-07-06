import * as React from "react"
import { type ColumnDef, type Row } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { type DataTableColumnId } from "./data-table-types"

interface DataTableBadgeColumnConfig<TData> {
  accessorKey: DataTableColumnId<TData>
  title: string
  fallback?: React.ReactNode | ((row: Row<TData>) => React.ReactNode)
  enableHiding?: boolean
  enableSorting?: boolean
}

export function createBadgeColumn<TData>({
  accessorKey,
  title,
  fallback = null,
  enableHiding,
  enableSorting,
}: DataTableBadgeColumnConfig<TData>): ColumnDef<TData> {
  return {
    accessorKey,
    meta: {
      label: title,
    },
    header: createDataTableColumnHeader<TData, unknown>(title),
    cell: ({ row }) => {
      const value =
        row.getValue<React.ReactNode | null | undefined>(accessorKey)

      if (value === null || value === undefined || value === "") {
        return typeof fallback === "function" ? fallback(row) : fallback
      }

      return <Badge variant="outline">{value}</Badge>
    },
    enableHiding,
    enableSorting,
  }
}
