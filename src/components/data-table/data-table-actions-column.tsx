import { type ColumnDef } from "@tanstack/react-table"

import { dataTableCopy } from "./data-table-copy"
import {
  DataTableRowActions,
  type DataTableRowAction,
} from "./data-table-row-actions"

export function createActionsColumn<TData>(
  actions: readonly DataTableRowAction<TData>[]
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
        <DataTableRowActions row={row} actions={actions} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  }
}
