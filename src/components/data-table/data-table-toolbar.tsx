import { type Column, type OnChangeFn, type Table } from "@tanstack/react-table"
import * as React from "react"

import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"
import {
  DataTableExportMenu,
  type DataTableExportConfig,
} from "./data-table-export-menu"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import {
  DataTableFilterMenu,
  type DataTableFilterMenuItem,
} from "./data-table-filter-menu"
import {
  dedupeFilterFields,
  dedupeGlobalSearchColumnIds,
  dedupeSearchFields,
  isEmptyFilterValue,
  normalizeSearchValue,
} from "./data-table-filter-utils"
import { DataTableSearchFilter } from "./data-table-search-filter"
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
  resultCount?: number
  onGlobalFilterChange?: OnChangeFn<string>
  onClearFilters?: () => void
}

type DataTableToolbarFilterDefinition<TData> =
  | {
      id: string
      kind: "faceted"
      label: string
      icon: DataTableFilterField<TData>["icon"]
      field: DataTableFilterField<TData>
    }
  | {
      id: string
      kind: "search"
      label: string
      icon: DataTableSearchField<TData>["icon"]
      field: DataTableSearchField<TData>
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
  const value: unknown = table.getState().globalFilter
  return typeof value === "string" ? value : ""
}

function hasRenderableContent(content: React.ReactNode): boolean {
  return React.Children.toArray(content).length > 0
}

function createFilterDefinitions<TData>({
  table,
  searchFields,
  filterFields,
}: {
  table: Table<TData>
  searchFields: readonly DataTableSearchField<TData>[]
  filterFields: readonly DataTableFilterField<TData>[]
}): DataTableToolbarFilterDefinition<TData>[] {
  const definitions: DataTableToolbarFilterDefinition<TData>[] = []
  const seenIds = new Set<string>()

  for (const field of filterFields) {
    const id = String(field.id)
    const column = table.getColumn(id)
    if (!column || !column.getCanFilter() || seenIds.has(id)) continue

    const label =
      normalizeVisibleText(field.title) || resolveColumnLabel(column, id)
    definitions.push({ id, icon: field.icon, kind: "faceted", label, field })
    seenIds.add(id)
  }

  for (const field of searchFields) {
    const id = String(field.id)
    const column = table.getColumn(id)
    if (!column || !column.getCanFilter() || seenIds.has(id)) continue

    const label =
      normalizeVisibleText(field.label) || resolveColumnLabel(column, id)
    definitions.push({ id, icon: field.icon, kind: "search", label, field })
    seenIds.add(id)
  }

  return definitions
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
  resultCount,
  onGlobalFilterChange,
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
  const filterDefinitions = React.useMemo(
    () =>
      createFilterDefinitions({
        table,
        searchFields: normalizedSearchFields,
        filterFields: normalizedFilterFields,
      }),
    [normalizedFilterFields, normalizedSearchFields, table]
  )
  const definitionIds = React.useMemo(
    () => new Set(filterDefinitions.map((definition) => definition.id)),
    [filterDefinitions]
  )
  const columnFilters = table.getState().columnFilters
  const appliedFilterIds = React.useMemo(
    () =>
      columnFilters
        .filter(
          (filter) =>
            definitionIds.has(filter.id) && !isEmptyFilterValue(filter.value)
        )
        .map((filter) => filter.id),
    [columnFilters, definitionIds]
  )
  const [manuallyActiveFilterIds, setManuallyActiveFilterIds] =
    React.useState<string[]>([])
  const [pendingOpenFilterId, setPendingOpenFilterId] =
    React.useState<string>()
  const activeFilterIds = React.useMemo(() => {
    const activeIds = manuallyActiveFilterIds.filter((id) =>
      definitionIds.has(id)
    )
    for (const id of appliedFilterIds) {
      if (!activeIds.includes(id)) activeIds.push(id)
    }
    return activeIds
  }, [appliedFilterIds, definitionIds, manuallyActiveFilterIds])

  const resolvedGlobalFilterValue = resolveTableGlobalFilterValue(
    table,
    globalFilterValue
  )
  const isGlobalFiltered =
    normalizeSearchValue(resolvedGlobalFilterValue).length > 0
  const isColumnFiltered = columnFilters.some(
    (filter) => !isEmptyFilterValue(filter.value)
  )
  const isFiltered =
    isColumnFiltered || isGlobalFiltered || isExternallyFiltered
  const hasActions = hasRenderableContent(actions)
  const resolvedCanExport = canExport ?? table.getRowModel().rows.length > 0
  const shouldRenderExport = enableExport
  const exportDisabled =
    !resolvedCanExport || (isLoading && !allowExportWhileLoading)
  const hasUtilityActions =
    enableViewOptions || shouldRenderExport || hasActions

  const activeDefinitions = React.useMemo(
    () =>
      activeFilterIds.flatMap((id) => {
        const definition = filterDefinitions.find((item) => item.id === id)
        return definition ? [definition] : []
      }),
    [activeFilterIds, filterDefinitions]
  )
  const availableFilterItems = React.useMemo<DataTableFilterMenuItem[]>(
    () =>
      filterDefinitions
        .filter((definition) => !activeFilterIds.includes(definition.id))
        .map((definition) => ({
          id: definition.id,
          icon: definition.icon,
          kind: definition.kind,
          label: definition.label,
        })),
    [activeFilterIds, filterDefinitions]
  )

  const updateGlobalFilter = React.useCallback(
    (value: string) => {
      if (onGlobalFilterChange) onGlobalFilterChange(value)
      else table.setGlobalFilter(value)
    },
    [onGlobalFilterChange, table]
  )

  const addFilter = React.useCallback((id: string) => {
    setManuallyActiveFilterIds((previous) =>
      previous.includes(id) ? previous : [...previous, id]
    )
    setPendingOpenFilterId(id)
  }, [])

  const removeFilter = React.useCallback((id: string) => {
    setManuallyActiveFilterIds((previous) =>
      previous.filter((item) => item !== id)
    )
    setPendingOpenFilterId((current) =>
      current === id ? undefined : current
    )
  }, [])

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-2"
      data-slot="data-table-toolbar"
    >
      {normalizedGlobalSearch ? (
        <DataTableSearchInput
          ariaLabel={
            normalizeVisibleText(globalSearchAriaLabel) ||
            normalizeVisibleText(normalizedGlobalSearch.ariaLabel) ||
            normalizeVisibleText(normalizedGlobalSearch.label) ||
            normalizeVisibleText(normalizedGlobalSearch.placeholder) ||
            dataTableCopy.toolbar.search
          }
          placeholder={
            normalizeVisibleText(normalizedGlobalSearch.placeholder) ||
            dataTableCopy.toolbar.searchPlaceholder
          }
          value={resolvedGlobalFilterValue}
          isLoading={isLoading}
          className="w-full sm:w-64 lg:w-72 xl:w-80"
          onValueChange={updateGlobalFilter}
          onClear={() => updateGlobalFilter("")}
        />
      ) : null}

      {activeDefinitions.map((definition) => {
        const column = table.getColumn(definition.id)
        if (!column) return null

        if (definition.kind === "faceted") {
          const field = definition.field
          return (
            <DataTableFacetedFilter
              key={definition.id}
              column={column}
              icon={definition.icon}
              title={definition.label}
              options={field.options}
              groups={field.groups}
              showCounts={field.showCounts ?? !manualFiltering}
              facetCountSource={field.countSource}
              facetValueToOptionValue={field.facetValueToOptionValue}
              defaultOpen={pendingOpenFilterId === definition.id}
              onRemove={() => removeFilter(definition.id)}
            />
          )
        }

        return (
          <DataTableSearchFilter
            key={definition.id}
            column={column}
            icon={definition.icon}
            title={definition.label}
            ariaLabel={definition.field.ariaLabel}
            placeholder={definition.field.placeholder}
            defaultOpen={pendingOpenFilterId === definition.id}
            onRemove={() => removeFilter(definition.id)}
          />
        )
      })}

      {filterDefinitions.length ? (
        <DataTableFilterMenu
          items={availableFilterItems}
          onSelect={addFilter}
        />
      ) : null}

      {typeof resultCount === "number" ? (
        <span
          role="status"
          className={cn(
            "shrink-0 text-sm text-muted-foreground",
            isFiltered && "text-foreground"
          )}
          aria-live="polite"
          aria-atomic="true"
          data-slot="data-table-result-count"
        >
          {dataTableCopy.toolbar.results(resultCount)}
        </span>
      ) : null}

      {hasUtilityActions ? (
        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
          {enableViewOptions ? <DataTableViewOptions table={table} /> : null}
          {shouldRenderExport ? (
            <DataTableExportMenu
              table={table}
              manualFiltering={manualFiltering}
              disabled={exportDisabled}
              {...exportConfig}
            />
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  )
}
