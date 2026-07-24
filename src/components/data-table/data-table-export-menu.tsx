import { type Column, type Row, type Table } from "@tanstack/react-table"
import { DownloadIcon } from "lucide-react"
import * as React from "react"

import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { exportRowsToXlsx, type XlsxCellValue } from "@/lib/export"

import { dataTableCopy } from "./data-table-copy"

type ExportColumnScope = "visible" | "all"
type ExportRowScope = "current" | "filtered" | "loaded"
export type DataTableColumnExportPolicy = "opt-out" | "opt-in"
export type DataTableExportOptionId =
  | "current-view"
  | "filtered"
  | "loaded"

interface DataTableExportOption {
  id: DataTableExportOptionId
  label: string
  description: string
  rowScope: ExportRowScope
  columnScope: ExportColumnScope
}

export interface DataTableFilteredExportContext<TData> {
  table: Table<TData>
  columns: readonly Column<TData, unknown>[]
  filename: string
  sheetName: string
}

export interface DataTableExportMenuProps<TData> {
  table: Table<TData>
  manualFiltering?: boolean
  filename?: string
  sheetName?: string
  columnExportPolicy?: DataTableColumnExportPolicy
  canExportColumn?: (column: Column<TData, unknown>) => boolean
  onExportFilteredRows?: (
    context: DataTableFilteredExportContext<TData>
  ) => void | Promise<void>
  onExportSuccess?: (optionId: DataTableExportOptionId) => void
  onExportError?: (error: Error) => void
}

export type DataTableExportConfig<TData> = Omit<
  DataTableExportMenuProps<TData>,
  "table" | "manualFiltering"
>

interface ExportOptionState<TData> {
  option: DataTableExportOption
  columns: readonly Column<TData, unknown>[]
  hasRows: boolean
  isRemote: boolean
  canExport: boolean
}

const exportOptions = [
  {
    id: "current-view",
    label: dataTableCopy.exportMenu.currentView,
    description: dataTableCopy.exportMenu.currentViewDescription,
    rowScope: "current",
    columnScope: "visible",
  },
  {
    id: "filtered",
    label: dataTableCopy.exportMenu.filteredRows,
    description: dataTableCopy.exportMenu.filteredRowsDescription,
    rowScope: "filtered",
    columnScope: "visible",
  },
  {
    id: "loaded",
    label: dataTableCopy.exportMenu.loadedRows,
    description: dataTableCopy.exportMenu.loadedRowsDescription,
    rowScope: "loaded",
    columnScope: "all",
  },
] as const satisfies readonly DataTableExportOption[]

const INVALID_FILENAME_CHARACTERS = new Set([
  "<",
  ">",
  ":",
  '"',
  "/",
  "\\",
  "|",
  "?",
  "*",
])

const INVALID_SHEET_NAME_CHARACTERS = new Set([
  "[",
  "]",
  ":",
  "*",
  "?",
  "/",
  "\\",
])

const MAX_EXCEL_CELL_CHARACTERS = 32_767

class DataTableExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DataTableExportError"
  }
}

function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new DataTableExportError(
        "Ocorreu um erro desconhecido durante a exportação."
      )
}

function replaceRestrictedCharacters(
  value: string,
  restrictedCharacters: ReadonlySet<string>,
  replacement: string
): string {
  let normalizedValue = ""

  for (const character of value) {
    const codePoint = character.codePointAt(0)

    if (
      codePoint === undefined ||
      codePoint <= 0x1f ||
      restrictedCharacters.has(character)
    ) {
      normalizedValue += replacement
      continue
    }

    normalizedValue += character
  }

  return normalizedValue
}

function isValidXmlCodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x09 ||
    codePoint === 0x0a ||
    codePoint === 0x0d ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  )
}

function removeInvalidXmlCharacters(value: string): string {
  let sanitizedValue = ""

  for (const character of value) {
    const codePoint = character.codePointAt(0)

    if (codePoint !== undefined && isValidXmlCodePoint(codePoint)) {
      sanitizedValue += character
    }
  }

  return sanitizedValue
}

function normalizeFilename(filename: string): string {
  return (
    replaceRestrictedCharacters(
      filename,
      INVALID_FILENAME_CHARACTERS,
      "-"
    )
      .replace(/\s+/gu, " ")
      .trim() || "tabela"
  )
}

function normalizeSheetName(sheetName: string): string {
  return (
    replaceRestrictedCharacters(
      sheetName,
      INVALID_SHEET_NAME_CHARACTERS,
      " "
    )
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, 31) || "Dados"
  )
}

function normalizeExportText(value: string): string | null {
  const sanitizedValue = removeInvalidXmlCharacters(value)

  if (sanitizedValue.trim().length === 0) {
    return null
  }

  return sanitizedValue.slice(0, MAX_EXCEL_CELL_CHARACTERS)
}

function humanizeColumnId(columnId: string): string {
  return columnId
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/[-_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

function getValueType(value: unknown): string {
  if (Array.isArray(value)) return "array"
  if (value instanceof Date) return "Date"
  if (value === null) return "null"
  return typeof value
}

function normalizeExportCellValue(
  value: unknown,
  context: { columnId: string; rowId: string }
): XlsxCellValue {
  if (value === null || value === undefined) return null
  if (typeof value === "string") return normalizeExportText(value)
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new DataTableExportError(
        `A coluna "${context.columnId}" contém um número não finito na linha "${context.rowId}".`
      )
    }
    return value
  }
  if (typeof value === "boolean") return value
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      throw new DataTableExportError(
        `A coluna "${context.columnId}" contém uma data inválida na linha "${context.rowId}".`
      )
    }
    return value.toISOString()
  }
  if (Array.isArray(value)) {
    const items = value
      .map((item) => normalizeExportCellValue(item, context))
      .filter(
        (item): item is Exclude<XlsxCellValue, null | undefined> =>
          item !== null && item !== undefined
      )
      .map(String)
    return items.length ? normalizeExportText(items.join(", ")) : null
  }

  throw new DataTableExportError(
    `A coluna "${context.columnId}" contém um valor não exportável na linha "${context.rowId}". Tipo recebido: ${getValueType(value)}. Defina columnDef.meta.exportValue para normalizá-lo.`
  )
}

function getExportColumnHeader<TData>(
  column: Column<TData, unknown>
): string {
  const label = column.columnDef.meta?.label
  if (typeof label === "string" && label.trim()) return label.trim()
  if (
    typeof column.columnDef.header === "string" &&
    column.columnDef.header.trim()
  ) {
    return column.columnDef.header.trim()
  }
  return humanizeColumnId(column.id)
}

function hasExportAccessor<TData>(column: Column<TData, unknown>): boolean {
  return (
    typeof column.accessorFn === "function" ||
    typeof column.columnDef.meta?.exportValue === "function"
  )
}

function getExportColumns<TData>({
  table,
  scope,
  policy,
  canExportColumn,
}: {
  table: Table<TData>
  scope: ExportColumnScope
  policy: DataTableColumnExportPolicy
  canExportColumn?: (column: Column<TData, unknown>) => boolean
}): readonly Column<TData, unknown>[] {
  const columns =
    scope === "visible"
      ? table.getVisibleLeafColumns()
      : table.getAllLeafColumns()

  return columns.filter((column) => {
    const enabled =
      policy === "opt-in"
        ? column.columnDef.meta?.enableExport === true
        : column.columnDef.meta?.enableExport !== false
    return (
      enabled &&
      hasExportAccessor(column) &&
      (canExportColumn ? canExportColumn(column) : true)
    )
  })
}

function getExportRows<TData>(
  table: Table<TData>,
  scope: ExportRowScope
): readonly Row<TData>[] {
  if (scope === "current") return table.getRowModel().rows
  if (scope === "filtered") return table.getPrePaginationRowModel().rows
  return table.getCoreRowModel().rows
}

function resolveExportCellValue<TData>(
  column: Column<TData, unknown>,
  row: Row<TData>
): XlsxCellValue {
  const rawValue =
    typeof column.accessorFn === "function"
      ? row.getValue(column.id)
      : undefined
  const resolvedValue = column.columnDef.meta?.exportValue
    ? column.columnDef.meta.exportValue(rawValue, row.original)
    : rawValue

  return normalizeExportCellValue(resolvedValue, {
    columnId: column.id,
    rowId: row.id,
  })
}

function exportLocalTableRows<TData>({
  rows,
  columns,
  filename,
  sheetName,
}: {
  rows: readonly Row<TData>[]
  columns: readonly Column<TData, unknown>[]
  filename: string
  sheetName: string
}): Blob {
  if (!columns.length) {
    throw new DataTableExportError(
      "Nenhuma coluna exportável está disponível."
    )
  }
  if (!rows.length) {
    throw new DataTableExportError(
      "Nenhuma linha está disponível para exportação."
    )
  }

  const normalizedRows = rows.map((row) => {
    const exportRow: Record<string, XlsxCellValue> = {}
    for (const column of columns) {
      exportRow[column.id] = resolveExportCellValue(column, row)
    }
    return exportRow
  })

  return exportRowsToXlsx({
    filename,
    sheetName,
    columns: columns.map((column) => ({
      header: getExportColumnHeader(column),
      accessor: (row: Record<string, XlsxCellValue>) =>
        row[column.id] ?? null,
    })),
    rows: normalizedRows,
  })
}

function getAvailableExportOptions({
  usesManualFiltering,
  usesManualPagination,
  hasRemoteFilteredExport,
}: {
  usesManualFiltering: boolean
  usesManualPagination: boolean
  hasRemoteFilteredExport: boolean
}): readonly DataTableExportOption[] {
  if (usesManualPagination) {
    return exportOptions.filter(
      (option) =>
        option.rowScope === "current" ||
        (option.rowScope === "filtered" && hasRemoteFilteredExport)
    )
  }
  if (usesManualFiltering) {
    return exportOptions.filter((option) => option.rowScope !== "loaded")
  }
  return exportOptions
}

export function DataTableExportMenu<TData>({
  table,
  manualFiltering,
  filename = "tabela",
  sheetName = "Dados",
  columnExportPolicy = "opt-out",
  canExportColumn,
  onExportFilteredRows,
  onExportSuccess,
  onExportError,
}: DataTableExportMenuProps<TData>) {
  const [activeOptionId, setActiveOptionId] =
    React.useState<DataTableExportOptionId | null>(null)
  const exportInProgressRef = React.useRef(false)
  const usesManualFiltering =
    manualFiltering ?? table.options.manualFiltering === true
  const usesManualPagination = table.options.manualPagination === true
  const normalizedFilename = normalizeFilename(filename)
  const normalizedSheetName = normalizeSheetName(sheetName)
  const options = getAvailableExportOptions({
    usesManualFiltering,
    usesManualPagination,
    hasRemoteFilteredExport: typeof onExportFilteredRows === "function",
  })
  const optionStates: readonly ExportOptionState<TData>[] = options.map(
    (option) => {
      const columns = getExportColumns({
        table,
        scope: option.columnScope,
        policy: columnExportPolicy,
        canExportColumn,
      })
      const isRemote =
        option.rowScope === "filtered" && usesManualPagination
      const hasRows = isRemote
        ? true
        : getExportRows(table, option.rowScope).length > 0
      return {
        option,
        columns,
        hasRows,
        isRemote,
        canExport: columns.length > 0 && hasRows,
      }
    }
  )
  const isExporting = activeOptionId !== null
  const hasAvailableExport = optionStates.some((state) => state.canExport)

  async function handleExport(state: ExportOptionState<TData>) {
    if (exportInProgressRef.current || !state.canExport) return

    exportInProgressRef.current = true
    setActiveOptionId(state.option.id)
    try {
      if (state.isRemote) {
        if (!onExportFilteredRows) {
          throw new DataTableExportError(
            "A exportação remota dos resultados filtrados não foi configurada."
          )
        }
        await onExportFilteredRows({
          table,
          columns: state.columns,
          filename: normalizedFilename,
          sheetName: normalizedSheetName,
        })
      } else {
        exportLocalTableRows({
          rows: getExportRows(table, state.option.rowScope),
          columns: state.columns,
          filename: normalizedFilename,
          sheetName: normalizedSheetName,
        })
      }
      onExportSuccess?.(state.option.id)
    } catch (error) {
      const resolvedError = toError(error)
      if (onExportError) onExportError(resolvedError)
      else notify.error(resolvedError.message)
    } finally {
      exportInProgressRef.current = false
      setActiveOptionId(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-no-drag-scroll="true"
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center sm:w-auto lg:size-9 lg:px-0"
          aria-label={dataTableCopy.toolbar.exportAriaLabel}
          aria-busy={isExporting || undefined}
          disabled={isExporting || !hasAvailableExport}
        >
          {isExporting ? (
            <Spinner
              data-icon="inline-start"
              role={undefined}
              aria-label={undefined}
              aria-hidden="true"
              focusable="false"
            />
          ) : (
            <DownloadIcon
              data-icon="inline-start"
              aria-hidden="true"
              focusable="false"
            />
          )}
          <span className="lg:sr-only">
            {dataTableCopy.toolbar.export}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-no-drag-scroll="true"
        align="end"
        className="w-72"
      >
        <DropdownMenuLabel>{dataTableCopy.exportMenu.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {optionStates.map((state) => (
          <DropdownMenuItem
            key={state.option.id}
            disabled={!state.canExport || isExporting}
            onSelect={() => void handleExport(state)}
            className="items-start gap-2 py-2"
          >
            <DownloadIcon
              aria-hidden="true"
              focusable="false"
              className="mt-0.5 size-4 shrink-0"
            />
            <span className="grid min-w-0 gap-0.5">
              <span className="font-medium">{state.option.label}</span>
              <span className="text-xs text-muted-foreground">
                {state.option.description}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
