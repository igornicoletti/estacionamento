import {
  type Column,
  type Table,
} from "@tanstack/react-table"
import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { dataTableCopy } from "./data-table-copy"

function formatColumnLabel(columnId: string, label?: string) {
  return (label ?? columnId)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
}

function getColumnLabel<TData>(column: Column<TData, unknown>) {
  const label = column.columnDef.meta?.label

  return typeof label === "string" ? label : undefined
}

export function DataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide())

  if (!hideableColumns.length) {
    return null
  }

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              data-no-drag-scroll="true"
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={dataTableCopy.viewOptions.trigger}
            >
              <Settings2 aria-hidden="true" />
              <span className="sr-only">{dataTableCopy.viewOptions.trigger}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent
          data-no-drag-scroll="true"
          align="end"
          className="w-48"
        >
          {hideableColumns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => {
                column.toggleVisibility(!!value)
              }}
            >
              {formatColumnLabel(column.id, getColumnLabel(column))}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>
        <p>{dataTableCopy.viewOptions.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
