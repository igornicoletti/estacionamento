import { type Column, type OnChangeFn, type Table } from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"
import {
  DataTableExportMenu,
  type DataTableExportConfig,
} from "./data-table-export-menu"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import {
  dedupeFilterFields,
  dedupeGlobalSearchColumnIds,
  dedupeSearchFields,
  isEmptyFilterValue,
  normalizeSearchValue,
} from "./data-table-filter-utils"
import { DataTableSearchInput } from "./data-table-search-input"
import {
  type DataTableFilterField,
  type DataTableGlobalSearch,
  type DataTableSearchField,
} from "./data-table-types"
import { DataTableViewOptions } from "./data-table-view-options"

export interface DataTableToolbarProps<TData> {
  table: Table<TData>
  globalSearch?: DataTableGlobalSearch<TData>
  globalSearchAriaLabel?: string
  searchFields?: readonly DataTableSearchField<TData>[]
  filterFields?: readonly DataTableFilterField<TData>[]
  actions?: React.ReactNode
  enableViewOptions?: boolean
  enableExport?: boolean
  exportConfig?: DataTableExportConfig<TData>
  canExport?: boolean
  manualFiltering?: boolean
  isLoading?: boolean
  allowExportWhileLoading?: boolean
  isExternallyFiltered?: boolean
  globalFilterValue?: string
  onGlobalFilterChange?: OnChangeFn<string>
  onClearFilters?: () => void
}

function normalizeVisibleText(value: string | undefined): string {
  return (
    value
      ?.trim()
      .replace(/\s+/gu, " ")
      .normalize("NFC") ?? ""
  )
}

function formatColumnId(columnId: string): string {
  return columnId
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/[-_]+/gu, " ")
    .trim()
    .replace(/^./u, (character) =>
      character.toLocaleUpperCase("pt-BR")
    )
}

function resolveColumnLabel<TData>(
  column: Column<TData, unknown>,
  columnId: string
): string {
  const metadataLabel = normalizeVisibleText(column.columnDef.meta?.label)
  if (metadataLabel) return metadataLabel

  if (typeof column.columnDef.header === "string") {
    const headerLabel = normalizeVisibleText(column.columnDef.header)
    if (headerLabel) return headerLabel
  }

  return formatColumnId(columnId) || dataTableCopy.toolbar.search
}

function resolveTableGlobalFilterValue<TData>(
  table: Table<TData>,
  providedValue: string | undefined
): string {
  if (providedValue !== undefined) return providedValue
  const value = table.getState().globalFilter
  return typeof value === "string" ? value : ""
}

function hasRenderableContent(content: React.ReactNode): boolean {
  return React.Children.toArray(content).length > 0
}

export function DataTableToolbar<TData>({
  table,
  globalSearch,
  globalSearchAriaLabel,
  searchFields = [],
  filterFields = [],
  actions,
  enableViewOptions = true,
  enableExport = true,
  exportConfig,
  canExport,
  manualFiltering = false,
  isLoading = false,
  allowExportWhileLoading = false,
  isExternallyFiltered = false,
  globalFilterValue,
  onGlobalFilterChange,
  onClearFilters,
}: DataTableToolbarProps<TData>) {
  const normalizedGlobalSearch = React.useMemo(() => {
    if (!globalSearch) return undefined
    const columnIds = dedupeGlobalSearchColumnIds(globalSearch)
    return columnIds.length ? { ...globalSearch, columnIds } : undefined
  }, [globalSearch])
  const normalizedSearchFields = React.useMemo(
    () => dedupeSearchFields(searchFields),
    [searchFields]
  )
  const normalizedFilterFields = React.useMemo(
    () => dedupeFilterFields(filterFields),
    [filterFields]
  )
  const resolvedGlobalFilterValue = resolveTableGlobalFilterValue(
    table,
    globalFilterValue
  )
  const isGlobalFiltered =
    normalizeSearchValue(resolvedGlobalFilterValue).length > 0
  const isColumnFiltered = table
    .getState()
    .columnFilters.some((filter) => !isEmptyFilterValue(filter.value))
  const isFiltered =
    isColumnFiltered || isGlobalFiltered || isExternallyFiltered

  const updateGlobalFilter = React.useCallback(
    (value: string) => {
      if (onGlobalFilterChange) onGlobalFilterChange(value)
      else table.setGlobalFilter(value)
    },
    [onGlobalFilterChange, table]
  )

  const clearFilters = React.useCallback(() => {
    if (onClearFilters) {
      onClearFilters()
      return
    }
    table.resetColumnFilters(true)
    if (onGlobalFilterChange) onGlobalFilterChange("")
    else table.resetGlobalFilter(true)
  }, [onClearFilters, onGlobalFilterChange, table])

  const hasSearchFields = normalizedSearchFields.some((field) =>
    Boolean(table.getColumn(String(field.id)))
  )
  const hasFilterFields = normalizedFilterFields.some((field) =>
    Boolean(table.getColumn(String(field.id)))
  )
  const hasControls =
    Boolean(normalizedGlobalSearch) ||
    hasSearchFields ||
    hasFilterFields ||
    isFiltered
  const hasActions = hasRenderableContent(actions)
  const resolvedCanExport =
    canExport ?? table.getRowModel().rows.length > 0
  const shouldRenderExport =
    enableExport &&
    resolvedCanExport &&
    (allowExportWhileLoading || !isLoading)
  const hasUtilityActions =
    enableViewOptions || shouldRenderExport || hasActions
  const filterPrefix =
    normalizeVisibleText(dataTableCopy.toolbar.filterPlaceholderPrefix) ||
    "Filtrar"

  return (
    <div
      className={cn(
        "grid min-w-0 gap-3",
        hasControls &&
          hasUtilityActions &&
          "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
      )}
    >
      {hasControls ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          {normalizedGlobalSearch ? (
            <DataTableSearchInput
              ariaLabel={
                normalizeVisibleText(globalSearchAriaLabel) ||
                normalizeVisibleText(normalizedGlobalSearch.ariaLabel) ||
                normalizeVisibleText(normalizedGlobalSearch.label) ||
                dataTableCopy.toolbar.search
              }
              placeholder={
                normalizeVisibleText(normalizedGlobalSearch.placeholder) ||
                dataTableCopy.toolbar.searchPlaceholder
              }
              value={resolvedGlobalFilterValue}
              isLoading={isLoading}
              onValueChange={updateGlobalFilter}
              onClear={() => updateGlobalFilter("")}
            />
          ) : null}

          {normalizedSearchFields.map((field) => {
            const columnId = String(field.id)
            const column = table.getColumn(columnId)
            if (!column) return null

            const columnLabel =
              normalizeVisibleText(field.label) ||
              resolveColumnLabel(column, columnId)
            const accessibleLabel =
              normalizeVisibleText(field.ariaLabel) ||
              `${filterPrefix} ${columnLabel}`
            const filterValue = column.getFilterValue()
            const inputValue =
              typeof filterValue === "string" ? filterValue : ""

            return (
              <DataTableSearchInput
                key={columnId}
                ariaLabel={accessibleLabel}
                placeholder={
                  normalizeVisibleText(field.placeholder) ||
                  `${accessibleLabel}...`
                }
                value={inputValue}
                isLoading={isLoading}
                disabled={!column.getCanFilter()}
                onValueChange={(value) =>
                  column.setFilterValue(value || undefined)
                }
                onClear={() => column.setFilterValue(undefined)}
              />
            )
          })}

          {normalizedFilterFields.map((field) => {
            const columnId = String(field.id)
            const column = table.getColumn(columnId)
            if (!column || !column.getCanFilter()) return null

            return (
              <DataTableFacetedFilter
                key={columnId}
                column={column}
                title={field.title}
                options={field.options}
                groups={field.groups}
                showCounts={field.showCounts ?? !manualFiltering}
                facetCountSource={field.countSource}
                facetValueToOptionValue={field.facetValueToOptionValue}
                maxVisibleChips={field.maxVisibleChips}
              />
            )
          })}

          {isFiltered ? (
            <Button
              data-no-drag-scroll="true"
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0"
              aria-label={dataTableCopy.toolbar.clearFiltersAriaLabel}
              onClick={clearFilters}
            >
              {dataTableCopy.toolbar.clearFilters}
              <XIcon
                data-icon="inline-end"
                aria-hidden="true"
                focusable="false"
              />
            </Button>
          ) : null}
        </div>
      ) : null}

      {hasUtilityActions ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          {enableViewOptions ? <DataTableViewOptions table={table} /> : null}
          {shouldRenderExport ? (
            <DataTableExportMenu
              table={table}
              manualFiltering={manualFiltering}
              {...exportConfig}
            />
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  )
}
