import {
  type Column,
  type OnChangeFn,
  type Table,
} from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"
import { DataTableExportMenu } from "./data-table-export-menu"
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
  canExport?: boolean
  manualFiltering?: boolean
  isLoading?: boolean

  /**
   * Mantém a exportação disponível durante
   * carregamento ou refetch.
   *
   * O padrão false evita exportar um dataset
   * potencialmente em transição.
   */
  allowExportWhileLoading?: boolean

  /**
   * Indica filtros mantidos fora do estado
   * do TanStack Table.
   */
  isExternallyFiltered?: boolean

  /**
   * Quando omitido, usa table.state.globalFilter,
   * caso ele seja uma string.
   */
  globalFilterValue?: string

  onGlobalFilterChange?: OnChangeFn<string>

  /**
   * Quando fornecido, este callback é responsável
   * por limpar todos os filtros internos e externos.
   */
  onClearFilters?: () => void
}

interface DataTableToolbarControlsProps<TData> {
  table: Table<TData>
  globalSearch?: DataTableGlobalSearch<TData>
  globalSearchAriaLabel?: string
  searchFields: readonly DataTableSearchField<TData>[]
  filterFields: readonly DataTableFilterField<TData>[]
  manualFiltering: boolean
  isLoading: boolean
  isExternallyFiltered: boolean
  globalFilterValue: string
  onGlobalFilterChange?: OnChangeFn<string>
  onClearFilters?: () => void
}

interface DataTableToolbarActionsProps<TData> {
  table: Table<TData>
  enableViewOptions: boolean
  enableExport: boolean
  canExport?: boolean
  manualFiltering: boolean
  isLoading: boolean
  allowExportWhileLoading: boolean
  actions?: React.ReactNode
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

function formatColumnId(
  columnId: string
): string {
  return columnId
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/^./u, (character) =>
      character.toLocaleUpperCase("pt-BR")
    )
}

function resolveColumnLabel<TData>(
  column: Column<TData, unknown>,
  columnId: string
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

  return (
    formatColumnId(columnId) ||
    dataTableCopy.toolbar.search
  )
}

function resolveTableGlobalFilterValue<TData>(
  table: Table<TData>,
  providedValue: string | undefined
): string {
  if (providedValue !== undefined) {
    return providedValue
  }

  const tableValue =
    table.getState().globalFilter

  return typeof tableValue === "string"
    ? tableValue
    : ""
}

function hasRenderableContent(
  content: React.ReactNode
): boolean {
  return React.Children.toArray(
    content
  ).length > 0
}

function DataTableToolbarControls<TData>({
  table,
  globalSearch,
  globalSearchAriaLabel,
  searchFields,
  filterFields,
  manualFiltering,
  isLoading,
  isExternallyFiltered,
  globalFilterValue,
  onGlobalFilterChange,
  onClearFilters,
}: DataTableToolbarControlsProps<TData>) {
  const hasGlobalSearch =
    Boolean(globalSearch?.columnIds.length)

  const isGlobalFiltered =
    normalizeSearchValue(
      globalFilterValue
    ).length > 0

  const isColumnFiltered =
    table
      .getState()
      .columnFilters
      .some(
        (filter) =>
          !isEmptyFilterValue(
            filter.value
          )
      )

  const isFiltered =
    isColumnFiltered ||
    isGlobalFiltered ||
    isExternallyFiltered

  const updateGlobalFilter =
    React.useCallback(
      (value: string) => {
        if (onGlobalFilterChange) {
          onGlobalFilterChange(value)
          return
        }

        table.setGlobalFilter(value)
      },
      [onGlobalFilterChange, table]
    )

  const clearFilters =
    React.useCallback(() => {
      if (onClearFilters) {
        onClearFilters()
        return
      }

      table.resetColumnFilters(true)

      if (onGlobalFilterChange) {
        onGlobalFilterChange("")
        return
      }

      table.resetGlobalFilter(true)
    }, [
      onClearFilters,
      onGlobalFilterChange,
      table,
    ])

  const filterPrefix =
    normalizeVisibleText(
      dataTableCopy.toolbar
        .filterPlaceholderPrefix
    ) || "Filtrar"

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      {hasGlobalSearch &&
        globalSearch ? (
        <DataTableSearchInput
          ariaLabel={
            normalizeVisibleText(
              globalSearchAriaLabel
            ) ||
            dataTableCopy.toolbar.search
          }
          placeholder={
            normalizeVisibleText(
              globalSearch.placeholder
            ) ||
            dataTableCopy.toolbar
              .searchPlaceholder
          }
          value={globalFilterValue}
          isLoading={isLoading}
          onValueChange={
            updateGlobalFilter
          }
          onClear={() => {
            updateGlobalFilter("")
          }}
        />
      ) : null}

      {searchFields.map((field) => {
        const columnId = String(
          field.id
        )

        const column =
          table.getColumn(columnId)

        if (!column) {
          return null
        }

        const columnLabel =
          resolveColumnLabel(
            column,
            columnId
          )

        const accessibleLabel =
          `${filterPrefix} ${columnLabel}`

        const placeholder =
          normalizeVisibleText(
            field.placeholder
          ) ||
          `${accessibleLabel}...`

        const filterValue =
          column.getFilterValue()

        const inputValue =
          typeof filterValue === "string"
            ? filterValue
            : ""

        return (
          <DataTableSearchInput
            key={columnId}
            ariaLabel={accessibleLabel}
            placeholder={placeholder}
            value={inputValue}
            isLoading={isLoading}
            disabled={
              !column.getCanFilter()
            }
            onValueChange={(
              nextValue
            ) => {
              column.setFilterValue(
                nextValue.length > 0
                  ? nextValue
                  : undefined
              )
            }}
            onClear={() => {
              column.setFilterValue(
                undefined
              )
            }}
          />
        )
      })}

      {filterFields.map((field) => {
        const columnId = String(
          field.id
        )

        const column =
          table.getColumn(columnId)

        if (
          !column ||
          !column.getCanFilter()
        ) {
          return null
        }

        return (
          <DataTableFacetedFilter
            key={columnId}
            column={column}
            title={field.title}
            options={field.options}
            groups={field.groups}
            showCounts={
              field.showCounts ??
              !manualFiltering
            }
            maxVisibleChips={
              field.maxVisibleChips
            }
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
          aria-label={
            dataTableCopy.toolbar
              .clearFiltersAriaLabel
          }
          onClick={clearFilters}
        >
          {
            dataTableCopy.toolbar
              .clearFilters
          }

          <XIcon
            data-icon="inline-end"
            aria-hidden="true"
            focusable="false"
          />
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
  isLoading,
  allowExportWhileLoading,
  actions,
}: DataTableToolbarActionsProps<TData>) {
  const hasActions =
    hasRenderableContent(actions)

  const resolvedCanExport =
    canExport ??
    table.getRowModel().rows.length > 0

  const shouldRenderExport =
    enableExport &&
    resolvedCanExport &&
    (allowExportWhileLoading ||
      !isLoading)

  if (
    !enableViewOptions &&
    !shouldRenderExport &&
    !hasActions
  ) {
    return null
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
      {enableViewOptions ? (
        <DataTableViewOptions
          table={table}
        />
      ) : null}

      {shouldRenderExport ? (
        <DataTableExportMenu
          table={table}
          manualFiltering={
            manualFiltering
          }
        />
      ) : null}

      {actions}
    </div>
  )
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
  canExport,
  manualFiltering = false,
  isLoading = false,
  allowExportWhileLoading = false,
  isExternallyFiltered = false,
  globalFilterValue,
  onGlobalFilterChange,
  onClearFilters,
}: DataTableToolbarProps<TData>) {
  const normalizedGlobalSearch =
    React.useMemo(() => {
      if (!globalSearch) {
        return undefined
      }

      const columnIds =
        dedupeGlobalSearchColumnIds(
          globalSearch
        )

      if (columnIds.length === 0) {
        return undefined
      }

      return {
        ...globalSearch,
        columnIds,
      }
    }, [globalSearch])

  const normalizedSearchFields =
    React.useMemo(
      () =>
        dedupeSearchFields(
          searchFields
        ),
      [searchFields]
    )

  const normalizedFilterFields =
    React.useMemo(
      () =>
        dedupeFilterFields(
          filterFields
        ),
      [filterFields]
    )

  const resolvedGlobalFilterValue =
    resolveTableGlobalFilterValue(
      table,
      globalFilterValue
    )

  const hasSearchFields =
    normalizedSearchFields.some(
      (field) =>
        Boolean(
          table.getColumn(
            String(field.id)
          )
        )
    )

  const hasFilterFields =
    normalizedFilterFields.some(
      (field) =>
        Boolean(
          table.getColumn(
            String(field.id)
          )
        )
    )

  const hasActiveColumnFilters =
    table
      .getState()
      .columnFilters
      .some(
        (filter) =>
          !isEmptyFilterValue(
            filter.value
          )
      )

  const hasActiveGlobalFilter =
    normalizeSearchValue(
      resolvedGlobalFilterValue
    ).length > 0

  const hasControls =
    Boolean(
      normalizedGlobalSearch
    ) ||
    hasSearchFields ||
    hasFilterFields ||
    hasActiveColumnFilters ||
    hasActiveGlobalFilter ||
    isExternallyFiltered

  return (
    <div
      className={cn(
        "grid min-w-0 gap-3",
        hasControls &&
        "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
      )}
    >
      {hasControls ? (
        <DataTableToolbarControls
          table={table}
          globalSearch={
            normalizedGlobalSearch
          }
          globalSearchAriaLabel={
            globalSearchAriaLabel
          }
          searchFields={
            normalizedSearchFields
          }
          filterFields={
            normalizedFilterFields
          }
          manualFiltering={
            manualFiltering
          }
          isLoading={isLoading}
          isExternallyFiltered={
            isExternallyFiltered
          }
          globalFilterValue={
            resolvedGlobalFilterValue
          }
          onGlobalFilterChange={
            onGlobalFilterChange
          }
          onClearFilters={
            onClearFilters
          }
        />
      ) : null}

      <DataTableToolbarActions
        table={table}
        enableViewOptions={
          enableViewOptions
        }
        enableExport={enableExport}
        canExport={canExport}
        manualFiltering={
          manualFiltering
        }
        isLoading={isLoading}
        allowExportWhileLoading={
          allowExportWhileLoading
        }
        actions={actions}
      />
    </div>
  )
}
