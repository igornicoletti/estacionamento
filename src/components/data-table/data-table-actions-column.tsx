import { type ColumnDef, type Row } from "@tanstack/react-table"

import { dataTableCopy } from "./data-table-copy"
import {
  DataTableRowActions,
  type DataTableRowAction,
} from "./data-table-row-actions"

export function createActionsColumn<TData>(
  actions:
    | readonly DataTableRowAction<TData>[]
    | ((row: Row<TData>) => readonly DataTableRowAction<TData>[])
): ColumnDef<TData> {
  return {
    id: "actions",
    header: () => (
      <span className="sr-only">
        {dataTableCopy.accessibility.actionsColumn}
      </span>
    ),
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DataTableRowActions
          row={row}
          actions={typeof actions === "function" ? actions(row) : actions}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      enableExport: false,
    },
    size: 48,
  }
}
