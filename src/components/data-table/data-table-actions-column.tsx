import { type ColumnDef, type Row } from "@tanstack/react-table"

import { dataTableCopy } from "./data-table-copy"
import {
  DataTableRowActions,
  type DataTableRowAction,
} from "./data-table-row-actions"

const ACTIONS_COLUMN_ID = "actions"
const ACTIONS_COLUMN_SIZE = 48

export type DataTableRowActionsSource<TData> =
  | readonly DataTableRowAction<TData>[]
  | ((row: Row<TData>) => readonly DataTableRowAction<TData>[])

function resolveRowActions<TData>(
  source: DataTableRowActionsSource<TData>,
  row: Row<TData>
): readonly DataTableRowAction<TData>[] {
  return typeof source === "function" ? source(row) : source
}

export function createActionsColumn<TData>(
  actions: DataTableRowActionsSource<TData>
): ColumnDef<TData> {
  return {
    id: ACTIONS_COLUMN_ID,
    header: () => (
      <span className="sr-only">
        {dataTableCopy.accessibility.actionsColumn}
      </span>
    ),
    cell: ({ row }) => {
      const rowActions = resolveRowActions(actions, row)
      if (rowActions.length === 0) return null

      return (
        <div className="flex w-full justify-end">
          <DataTableRowActions row={row} actions={rowActions} />
        </div>
      )
    },
    enableColumnFilter: false,
    enableGlobalFilter: false,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    meta: { enableExport: false },
    size: ACTIONS_COLUMN_SIZE,
    minSize: ACTIONS_COLUMN_SIZE,
    maxSize: ACTIONS_COLUMN_SIZE,
  }
}
