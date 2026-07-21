import {
  type Column,
  type Row,
  type Table,
} from "@tanstack/react-table"
import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportRowsToXlsx, type XlsxCellValue } from "@/lib/export"

import { dataTableCopy } from "./data-table-copy"

interface DataTableExportMenuProps<TData> {
  table: Table<TData>
  manualFiltering?: boolean
}

type ExportColumnScope = "visible" | "all"
type ExportRowScope = "current" | "filtered" | "loaded"

interface DataTableExportOption {
  id: string
  label: string
  description: string
  rowScope: ExportRowScope
  columnScope: ExportColumnScope
}

const exportOptions: readonly DataTableExportOption[] = [
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
]

function formatExportColumnLabel(raw: string) {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
}

function normalizeExportCellValue(value: unknown): XlsxCellValue {
  if (value === null || value === undefined || value === "") {
    return null
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeExportCellValue(item))
      .join(", ")
  }

  return "—"
}

function getExportColumnHeader<TData>(column: Column<TData, unknown>) {
  const label = column.columnDef.meta?.label

  if (label) {
    return formatExportColumnLabel(label)
  }

  if (typeof column.columnDef.header === "string") {
    return formatExportColumnLabel(column.columnDef.header)
  }

  return formatExportColumnLabel(column.id)
}

function resolveExportCellValue<TData>(
  column: Column<TData, unknown>,
  row: Row<TData>
) {
  const rawValue = row.getValue(column.id)
  const exportValue = column.columnDef.meta?.exportValue

  if (exportValue) {
    return normalizeExportCellValue(exportValue(rawValue, row.original))
  }

  return normalizeExportCellValue(rawValue)
}

function getExportColumns<TData>(
  table: Table<TData>,
  scope: ExportColumnScope
) {
  const columns = scope === "visible"
    ? table.getVisibleLeafColumns()
    : table.getAllLeafColumns()

  return columns.filter((column) => column.columnDef.meta?.enableExport !== false)
}

function getExportRows<TData>(
  table: Table<TData>,
  rowScope: ExportRowScope,
  manualFiltering: boolean
) {
  if (rowScope === "current") {
    return table.getRowModel().rows
  }

  if (rowScope === "loaded" || manualFiltering) {
    return table.getCoreRowModel().rows
  }

  return table.getFilteredRowModel().rows
}

function exportTableRows<TData>({
  table,
  option,
  manualFiltering,
}: {
  table: Table<TData>
  option: DataTableExportOption
  manualFiltering: boolean
}) {
  const exportableColumns = getExportColumns(table, option.columnScope)

  if (!exportableColumns.length) {
    return
  }

  const tableRows = getExportRows(table, option.rowScope, manualFiltering)
  const normalizedRows: Array<Record<string, XlsxCellValue>> =
    tableRows.map((row) => {
      const exportRow: Record<string, XlsxCellValue> = {}

      for (const column of exportableColumns) {
        exportRow[column.id] = resolveExportCellValue(column, row)
      }

      return exportRow
    })

  exportRowsToXlsx({
    filename: "tabela",
    sheetName: "Dados",
    columns: exportableColumns.map((column) => ({
      header: getExportColumnHeader(column),
      accessor: (row: Record<string, XlsxCellValue>) => {
        const rowValue = row[column.id]

        return normalizeExportCellValue(rowValue)
      },
    })),
    rows: normalizedRows,
  })
}

export function DataTableExportMenu<TData>({
  table,
  manualFiltering = false,
}: DataTableExportMenuProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-no-drag-scroll="true"
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center sm:w-auto lg:size-9 lg:px-0"
          aria-label={dataTableCopy.toolbar.export}
        >
          <DownloadIcon aria-hidden="true" />
          <span className="lg:sr-only">{dataTableCopy.toolbar.export}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-no-drag-scroll="true"
        align="end"
        className="w-72"
      >
        <DropdownMenuLabel>{dataTableCopy.exportMenu.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exportOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onSelect={() => {
              exportTableRows({ table, option, manualFiltering })
            }}
            className="items-start gap-2 py-2"
          >
            <DownloadIcon aria-hidden="true" className="mt-0.5 size-4" />
            <span className="grid min-w-0 gap-0.5">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
