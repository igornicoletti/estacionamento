import { type Column, type Table } from "@tanstack/react-table"
import { EyeIcon, RotateCcwIcon, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { dataTableCopy } from "./data-table-copy"

type DataTableColumnLabelResolver<TData> = (
  column: Column<TData, unknown>
) => string | undefined

export interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  triggerLabel?: string
  ariaLabel?: string
  tooltipLabel?: string
  menuLabel?: string
  showAllLabel?: string
  resetLabel?: string
  getColumnLabel?: DataTableColumnLabelResolver<TData>
  keepOpenOnToggle?: boolean
}

function normalizeVisibleText(value: string | undefined): string {
  return (
    value
      ?.trim()
      .replace(/\s+/gu, " ")
      .normalize("NFC") ?? ""
  )
}

function humanizeColumnId(columnId: string): string {
  const normalized = columnId
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/[-_]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ")
  return normalized
    ? normalized.replace(/^./u, (character) =>
        character.toLocaleUpperCase("pt-BR")
      )
    : columnId
}

function resolveColumnLabel<TData>(
  column: Column<TData, unknown>,
  resolver: DataTableColumnLabelResolver<TData> | undefined
): string {
  const custom = normalizeVisibleText(resolver?.(column))
  if (custom) return custom

  const metadata = normalizeVisibleText(column.columnDef.meta?.label)
  if (metadata) return metadata

  if (typeof column.columnDef.header === "string") {
    const header = normalizeVisibleText(column.columnDef.header)
    if (header) return header
  }

  return humanizeColumnId(column.id)
}

function isColumnVisibleByDefault<TData>(
  table: Table<TData>,
  column: Column<TData, unknown>
): boolean {
  return table.initialState.columnVisibility?.[column.id] !== false
}

export function DataTableViewOptions<TData>({
  table,
  triggerLabel = dataTableCopy.viewOptions.trigger,
  ariaLabel,
  tooltipLabel = dataTableCopy.viewOptions.tooltip,
  menuLabel = "Colunas visíveis",
  showAllLabel = "Mostrar todas",
  resetLabel = "Restaurar padrão",
  getColumnLabel,
  keepOpenOnToggle = true,
}: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
  if (!columns.length) return null

  const resolvedTriggerLabel =
    normalizeVisibleText(triggerLabel) || dataTableCopy.viewOptions.trigger
  const resolvedAriaLabel =
    normalizeVisibleText(ariaLabel) || resolvedTriggerLabel
  const resolvedTooltipLabel =
    normalizeVisibleText(tooltipLabel) || resolvedTriggerLabel
  const resolvedMenuLabel =
    normalizeVisibleText(menuLabel) || resolvedTriggerLabel
  const resolvedShowAllLabel =
    normalizeVisibleText(showAllLabel) || "Mostrar todas"
  const resolvedResetLabel =
    normalizeVisibleText(resetLabel) || "Restaurar padrão"
  const areAllVisible = columns.every((column) => column.getIsVisible())
  const hasChanges = columns.some(
    (column) =>
      column.getIsVisible() !== isColumnVisibleByDefault(table, column)
  )

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              data-no-drag-scroll="true"
              type="button"
              variant="outline"
              size="lg"
              className="w-full justify-center sm:w-auto lg:size-9 lg:px-0"
              aria-label={resolvedAriaLabel}
            >
              <Settings2
                data-icon="inline-start"
                aria-hidden="true"
                focusable="false"
              />
              <span aria-hidden="true" className="lg:sr-only">
                {resolvedTriggerLabel}
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>

        <DropdownMenuContent
          data-no-drag-scroll="true"
          align="end"
          collisionPadding={16}
          className="w-[calc(100vw-2rem)] sm:w-64"
        >
          <DropdownMenuLabel>{resolvedMenuLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((column) => {
            const label = resolveColumnLabel(column, getColumnLabel)
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                textValue={label}
                onSelect={(event) => {
                  if (keepOpenOnToggle) event.preventDefault()
                }}
                onCheckedChange={(value) =>
                  column.toggleVisibility(value === true)
                }
              >
                {label}
              </DropdownMenuCheckboxItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={areAllVisible}
            onSelect={() => table.toggleAllColumnsVisible(true)}
          >
            <EyeIcon aria-hidden="true" focusable="false" />
            {resolvedShowAllLabel}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasChanges}
            onSelect={() => table.resetColumnVisibility()}
          >
            <RotateCcwIcon aria-hidden="true" focusable="false" />
            {resolvedResetLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>
        <p>{resolvedTooltipLabel}</p>
      </TooltipContent>
    </Tooltip>
  )
}
