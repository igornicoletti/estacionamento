import {
  type Column,
  type Table,
} from "@tanstack/react-table"
import {
  EyeIcon,
  RotateCcwIcon,
  Settings2,
} from "lucide-react"

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

  /**
   * Texto visual apresentado ao lado do ícone.
   */
  triggerLabel?: string

  /**
   * Nome acessível contextual do botão.
   *
   * Exemplo:
   * "Gerenciar colunas da tabela de clientes".
   */
  ariaLabel?: string

  tooltipLabel?: string
  menuLabel?: string
  showAllLabel?: string
  resetLabel?: string

  /**
   * Permite substituir a resolução padrão de
   * labels para colunas específicas da feature.
   */
  getColumnLabel?: DataTableColumnLabelResolver<TData>

  /**
   * Mantém o menu aberto durante a alteração
   * de várias colunas.
   */
  keepOpenOnToggle?: boolean
}

function normalizeVisibleText(
  value: string | undefined
): string {
  return (
    value
      ?.trim()
      .replace(/\s+/gu, " ")
      .normalize("NFC") ?? ""
  )
}

function humanizeColumnId(
  columnId: string
): string {
  const normalizedLabel = columnId
    .replace(
      /([a-z0-9])([A-Z])/g,
      "$1 $2"
    )
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/gu, " ")

  if (normalizedLabel.length === 0) {
    return columnId
  }

  return normalizedLabel.replace(
    /^./u,
    (character) =>
      character.toLocaleUpperCase(
        "pt-BR"
      )
  )
}

function resolveDefaultColumnLabel<TData>(
  column: Column<TData, unknown>
): string {
  const metadataLabel =
    normalizeVisibleText(
      column.columnDef.meta?.label
    )

  if (metadataLabel.length > 0) {
    return metadataLabel
  }

  if (
    typeof column.columnDef.header ===
    "string"
  ) {
    const headerLabel =
      normalizeVisibleText(
        column.columnDef.header
      )

    if (headerLabel.length > 0) {
      return headerLabel
    }
  }

  return humanizeColumnId(column.id)
}

function resolveColumnLabel<TData>(
  column: Column<TData, unknown>,
  getColumnLabel:
    | DataTableColumnLabelResolver<TData>
    | undefined
): string {
  const customLabel =
    normalizeVisibleText(
      getColumnLabel?.(column)
    )

  return (
    customLabel ||
    resolveDefaultColumnLabel(column)
  )
}

function isColumnVisibleByDefault<TData>(
  table: Table<TData>,
  column: Column<TData, unknown>
): boolean {
  return (
    table.initialState
      .columnVisibility?.[
    column.id
    ] !== false
  )
}

export function DataTableViewOptions<TData>({
  table,
  triggerLabel =
  dataTableCopy.viewOptions.trigger,
  ariaLabel,
  tooltipLabel =
  dataTableCopy.viewOptions.tooltip,
  menuLabel = "Colunas visíveis",
  showAllLabel = "Mostrar todas",
  resetLabel = "Restaurar padrão",
  getColumnLabel,
  keepOpenOnToggle = true,
}: DataTableViewOptionsProps<TData>) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) =>
      column.getCanHide()
    )

  if (hideableColumns.length === 0) {
    return null
  }

  const resolvedTriggerLabel =
    normalizeVisibleText(
      triggerLabel
    ) ||
    dataTableCopy.viewOptions.trigger

  const resolvedAriaLabel =
    normalizeVisibleText(ariaLabel) ||
    resolvedTriggerLabel

  const resolvedTooltipLabel =
    normalizeVisibleText(
      tooltipLabel
    ) ||
    resolvedTriggerLabel

  const resolvedMenuLabel =
    normalizeVisibleText(menuLabel) ||
    resolvedTriggerLabel

  const resolvedShowAllLabel =
    normalizeVisibleText(
      showAllLabel
    ) ||
    "Mostrar todas"

  const resolvedResetLabel =
    normalizeVisibleText(
      resetLabel
    ) ||
    "Restaurar padrão"

  const areAllColumnsVisible =
    hideableColumns.every(
      (column) =>
        column.getIsVisible()
    )

  const hasVisibilityChanges =
    hideableColumns.some(
      (column) =>
        column.getIsVisible() !==
        isColumnVisibleByDefault(
          table,
          column
        )
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
              aria-label={
                resolvedAriaLabel
              }
            >
              <Settings2
                aria-hidden="true"
                focusable="false"
              />

              <span
                aria-hidden="true"
                className="lg:sr-only"
              >
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
          <DropdownMenuLabel>
            {resolvedMenuLabel}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {hideableColumns.map(
            (column) => {
              const columnLabel =
                resolveColumnLabel(
                  column,
                  getColumnLabel
                )

              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={
                    column.getIsVisible()
                  }
                  textValue={columnLabel}
                  onSelect={(event) => {
                    if (
                      keepOpenOnToggle
                    ) {
                      event.preventDefault()
                    }
                  }}
                  onCheckedChange={(
                    value
                  ) => {
                    column.toggleVisibility(
                      value === true
                    )
                  }}
                >
                  {columnLabel}
                </DropdownMenuCheckboxItem>
              )
            }
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={
              areAllColumnsVisible
            }
            onSelect={() => {
              table.toggleAllColumnsVisible(
                true
              )
            }}
          >
            <EyeIcon
              aria-hidden="true"
              focusable="false"
            />

            {resolvedShowAllLabel}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              !hasVisibilityChanges
            }
            onSelect={() => {
              table.resetColumnVisibility()
            }}
          >
            <RotateCcwIcon
              aria-hidden="true"
              focusable="false"
            />

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
