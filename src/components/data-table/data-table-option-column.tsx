import { type ColumnDef } from "@tanstack/react-table"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { includesSelectedValue } from "./data-table-filter-fns"
import { DataTableOptionCell } from "./data-table-option-cell"
import {
  type DataTableColumnId,
  type DataTableFilterOption,
} from "./data-table-types"

interface DataTableOptionColumnConfig<TData> {
  accessorKey: DataTableColumnId<TData>
  title: string
  options: readonly DataTableFilterOption[]
  className?: string
  enableHiding?: boolean
  enableSorting?: boolean
}

export function createOptionColumn<TData>({
  accessorKey,
  title,
  options,
  className,
  enableHiding,
  enableSorting,
}: DataTableOptionColumnConfig<TData>): ColumnDef<TData> {
  return {
    accessorKey,
    meta: {
      label: title,
    },
    header: createDataTableColumnHeader<TData, unknown>(title),
    cell: ({ row }) => (
      <DataTableOptionCell
        options={options}
        value={String(row.getValue(accessorKey) ?? "")}
        className={className}
      />
    ),
    filterFn: includesSelectedValue,
    enableHiding,
    enableSorting,
  }
}
