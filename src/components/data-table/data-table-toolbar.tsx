import {
  type Column,
  type Row,
  type Table,
} from "@tanstack/react-table"
import { DownloadIcon, XIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { exportRowsToXlsx, type XlsxCellValue } from "@/lib/export"

import { dataTableCopy } from "./data-table-copy"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { normalizeSearchValue } from "./data-table-filter-utils"
import { DataTableSearchInput } from "./data-table-search-input"
import {
  type DataTableFilterField,
  type DataTableGlobalSearch,
  type DataTableSearchField,
} from "./data-table-types"
import { DataTableViewOptions } from "./data-table-view-options"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  globalSearch?: DataTableGlobalSearch<TData>
  searchFields?: readonly DataTableSearchField<TData>[]
  filterFields?: readonly DataTableFilterField<TData>[]
  actions?: React.ReactNode
  enableViewOptions?: boolean
  enableExport?: boolean
  canExport?: boolean
  manualFiltering?: boolean
  isLoading?: boolean
  globalFilterValue?: string
  onGlobalFilterChange?: (value: string) => void
  onClearFilters?: () => void
}

interface DataTableToolbarControlsProps<TData> {
  table: Table<TData>
  globalSearch?: DataTableGlobalSearch<TData>
  searchFields: readonly DataTableSearchField<TData>[]
  filterFields: readonly DataTableFilterField<TData>[]
  manualFiltering: boolean
  isLoading: boolean
  globalFilterValue: string
  onGlobalFilterChange?: (value: string) => void
  onClearFilters?: () => void
}

interface DataTableToolbarActionsProps<TData> {
  table: Table<TData>
  enableViewOptions: boolean
  enableExport: boolean
  canExport: boolean
  manualFiltering: boolean
  actions?: React.ReactNode
}

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

function DataTableToolbarControls<TData>({
  table,
  globalSearch,
  searchFields,
  filterFields,
  manualFiltering,
  isLoading,
  globalFilterValue,
  onGlobalFilterChange,
  onClearFilters,
}: DataTableToolbarControlsProps<TData>) {
  const hasGlobalSearch = Boolean(globalSearch?.columnIds.length)
  const normalizedGlobalFilterValue = normalizeSearchValue(globalFilterValue)
  const isGlobalFiltered =
    hasGlobalSearch && normalizedGlobalFilterValue.length > 0
  const isColumnFiltered = table.getState().columnFilters.length > 0
  const isFiltered = isColumnFiltered || isGlobalFiltered

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
      {hasGlobalSearch && globalSearch ? (
        <DataTableSearchInput
          ariaLabel={globalSearch.placeholder ?? dataTableCopy.toolbar.search}
          placeholder={
            globalSearch.placeholder ?? dataTableCopy.toolbar.searchPlaceholder
          }
          value={globalFilterValue}
          isLoading={isLoading}
          onValueChange={(value) => {
            onGlobalFilterChange?.(value)
          }}
          onClear={() => {
            onGlobalFilterChange?.("")
          }}
        />
      ) : null}

      {searchFields.map((field) => {
        const column = table.getColumn(field.id)

        if (!column) {
          return null
        }

        const value = column.getFilterValue()
        const inputValue = typeof value === "string" ? value : ""
        const ariaLabel =
          field.placeholder ??
          `${dataTableCopy.toolbar.filterPlaceholderPrefix} ${field.id}`

        return (
          <DataTableSearchInput
            key={field.id}
            ariaLabel={ariaLabel}
            placeholder={
              field.placeholder ??
              `${dataTableCopy.toolbar.filterPlaceholderPrefix} ${field.id}...`
            }
            value={inputValue}
            isLoading={isLoading}
            onValueChange={(nextValue) => {
              const normalizedValue = normalizeSearchValue(nextValue)

              column.setFilterValue(normalizedValue || undefined)
            }}
            onClear={() => {
              column.setFilterValue(undefined)
            }}
          />
        )
      })}

      {filterFields.map((field) => {
        const column = table.getColumn(field.id)

        if (!column) {
          return null
        }

        return (
          <DataTableFacetedFilter
            key={field.id}
            column={column}
            title={field.title}
            options={field.options}
            showCounts={field.showCounts ?? !manualFiltering}
            maxVisibleChips={field.maxVisibleChips}
          />
        )
      })}

      {isFiltered ? (
        <Button
          data-no-drag-scroll="true"
          type="button"
          variant="ghost"
          aria-label={dataTableCopy.toolbar.clearFiltersAriaLabel}
          onClick={() => {
            if (onClearFilters) {
              onClearFilters()
              return
            }

            table.resetColumnFilters()
            onGlobalFilterChange?.("")
          }}
        >
          {dataTableCopy.toolbar.clearFilters}
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}

function DataTableToolbarActions<TData>({
  table,
  enableViewOptions,
  enableExport,
  canExport,
  manualFiltering,
  actions,
}: DataTableToolbarActionsProps<TData>) {
  if (!enableViewOptions && !(enableExport && canExport) && !actions) {
    return null
  }

  function handleExport() {
    const exportableColumns = table
      .getVisibleLeafColumns()
      .filter((column) => column.columnDef.meta?.enableExport !== false)

    if (!exportableColumns.length) {
      return
    }

    const tableRows = manualFiltering
      ? table.getCoreRowModel().rows
      : table.getFilteredRowModel().rows

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

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 lg:justify-end">
      {enableViewOptions ? <DataTableViewOptions table={table} /> : null}
      {enableExport && canExport ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-no-drag-scroll="true"
              type="button"
              variant="outline"
              size="icon-lg"
              onClick={handleExport}
            >
              <DownloadIcon aria-hidden="true" />
              <span className="sr-only">{dataTableCopy.toolbar.export}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dataTableCopy.toolbar.exportTooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
      {actions}
    </div>
  )
}

export function DataTableToolbar<TData>({
  table,
  globalSearch,
  searchFields = [],
  filterFields = [],
  actions,
  enableViewOptions = true,
  enableExport = true,
  canExport = true,
  manualFiltering = false,
  isLoading = false,
  globalFilterValue = "",
  onGlobalFilterChange,
  onClearFilters,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <DataTableToolbarControls
        table={table}
        globalSearch={globalSearch}
        searchFields={searchFields}
        filterFields={filterFields}
        manualFiltering={manualFiltering}
        isLoading={isLoading}
        globalFilterValue={globalFilterValue}
        onGlobalFilterChange={onGlobalFilterChange}
        onClearFilters={onClearFilters}
      />

      <DataTableToolbarActions<TData>
        table={table}
        enableViewOptions={enableViewOptions}
        enableExport={enableExport}
        canExport={canExport}
        manualFiltering={manualFiltering}
        actions={actions}
      />
    </div>
  )
}
