import * as React from "react"
import { type ColumnDef, type Row } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

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
    header: () => <div className="text-center font-medium">{title}</div>,
    cell: ({ row }) => {
      const value =
        row.getValue<React.ReactNode | null | undefined>(accessorKey)

      if (value === null || value === undefined || value === "") {
        const resolvedFallback = typeof fallback === "function" ? fallback(row) : fallback

        return resolvedFallback ? <div className="flex justify-center">{resolvedFallback}</div> : null
      }

      return (
        <div className="flex justify-center">
          <Badge variant="outline" className="justify-center text-center">{value}</Badge>
        </div>
      )
    },
    enableHiding,
    enableSorting: enableSorting ?? false,
  }
}
