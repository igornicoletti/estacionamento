import { type ColumnDef } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"

import { dataTableCopy } from "./data-table-copy"

export function createSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => {
      const selectableRows = table
        .getRowModel()
        .rows.filter((row) => row.getCanSelect())
      const hasSelectableRows = selectableRows.length > 0
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()

      return (
        <div className="flex w-8 items-center justify-center">
          <Checkbox
            data-no-drag-scroll="true"
            checked={isAllSelected || (isSomeSelected && "indeterminate")}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value)
            }}
            onClick={(event) => {
              event.stopPropagation()
            }}
            disabled={!hasSelectableRows}
            aria-label={dataTableCopy.accessibility.selectPageRows}
          />
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="flex w-8 items-center justify-center">
        <Checkbox
          data-no-drag-scroll="true"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
          }}
          onClick={(event) => {
            event.stopPropagation()
          }}
          disabled={!row.getCanSelect()}
          aria-label={dataTableCopy.accessibility.selectRow}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      enableExport: false,
    },
    size: 20,
  }
}
