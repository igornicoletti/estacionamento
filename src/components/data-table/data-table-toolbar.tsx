import { type Table } from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"
import { DataTableExportMenu } from "./data-table-export-menu"
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
    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3 xl:flex-nowrap">
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
            groups={field.groups}
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

  const utilityActionCount =
    (enableViewOptions ? 1 : 0) + (enableExport && canExport ? 1 : 0)

  return (
    <div
      className={cn(
        "grid min-w-0 items-center gap-2 sm:flex sm:flex-wrap sm:justify-start lg:flex-nowrap lg:justify-end",
        utilityActionCount === 1 && !actions ? "grid-cols-1" : "grid-cols-2"
      )}
    >
      {enableViewOptions ? <DataTableViewOptions table={table} /> : null}
      {enableExport && canExport ? (
        <DataTableExportMenu table={table} manualFiltering={manualFiltering} />
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
  const hasControls =
    Boolean(globalSearch?.columnIds.length) ||
    searchFields.length > 0 ||
    filterFields.length > 0

  return (
    <div
      className={cn(
        "grid min-w-0 gap-3",
        hasControls && "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
      )}
    >
      {hasControls ? (
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
      ) : null}

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
