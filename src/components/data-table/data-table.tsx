import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Header,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { DatabaseIcon, ListRestartIcon, PlusIcon, RefreshCcwIcon, SearchXIcon } from "lucide-react"
import * as React from "react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { cn } from "@/lib/utils"
import { DataTableColumnHeader } from "./data-table-column-header"
import {
  DATA_TABLE_INITIAL_PAGE_SIZE,
  DATA_TABLE_PAGE_SIZE_OPTIONS,
  DATA_TABLE_SKELETON,
} from "./data-table-constants"
import { dataTableCopy } from "./data-table-copy"
import { includesSelectedValue } from "./data-table-filter-fns"
import {
  dedupeFilterFields,
  dedupeGlobalSearchColumnIds,
  dedupeSearchFields,
  dedupeStrings,
  isEmptyFilterValue,
  normalizeFilterText,
  normalizeSearchValue,
} from "./data-table-filter-utils"
import { DataTableLoadingSkeleton } from "./data-table-loading-skeleton"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableScrollContainer } from "./data-table-scroll-container"
import {
  dataTableColumnFiltersStateAdapter,
  dataTableColumnVisibilityStateAdapter,
  dataTableGlobalFilterStateAdapter,
  dataTablePaginationStateAdapter,
  dataTableRowSelectionStateAdapter,
  dataTableSortingStateAdapter,
  useControllableDataTableState,
} from "./data-table-state"
import { DataTableToolbar } from "./data-table-toolbar"
import {
  type DataTableColumnId,
  type DataTableFilterField,
  type DataTableGlobalSearch,
  type DataTableSearchField,
  type DataTableStateAction,
} from "./data-table-types"


function normalizePositiveInteger(value: number, fallback: number) {
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function resolveInitialSkeletonRowCount(pageSize: number) {
  const safePageSize = normalizePositiveInteger(
    pageSize,
    DATA_TABLE_SKELETON.fallbackRows
  )

  return Math.max(
    DATA_TABLE_SKELETON.minRows,
    Math.min(safePageSize, DATA_TABLE_SKELETON.maxRows)
  )
}

function getHeaderAriaSort<TData, TValue>(header: Header<TData, TValue>) {
  const sortState = header.column.getIsSorted()

  if (sortState === "asc") {
    return "ascending" as const
  }

  if (sortState === "desc") {
    return "descending" as const
  }

  return undefined
}

function DataTableStatePanel({
  children,
  kind,
  separated = false,
}: {
  children: React.ReactNode
  kind: "empty" | "error" | "loading"
  separated?: boolean
}) {
  const isLiveRegion = kind === "loading" || kind === "error"

  return (
    <div
      role={kind === "error" ? "alert" : kind === "loading" ? "status" : undefined}
      aria-live={
        isLiveRegion ? (kind === "error" ? "assertive" : "polite") : undefined
      }
      className={cn(
        "flex min-h-48 flex-1 items-center justify-center px-3 py-8 sm:min-h-64 sm:px-4 sm:py-10",
        separated && "border-t"
      )}
    >
      <div className="w-full max-w-sm sm:max-w-md">{children}</div>
    </div>
  )
}

function DataTableActionButton({ action }: { action: DataTableStateAction }) {
  return (
    <Button type="button" variant="secondary" size="lg" onClick={action.onClick}>
      {action.icon}
      {action.label}
    </Button>
  )
}

function DataTableDefaultState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description: string
  icon: React.ReactNode
  action?: DataTableStateAction
}) {
  return (
    <AppEmptyState
      media={icon}
      title={title}
      description={description}
      actions={action ? <DataTableActionButton action={action} /> : null}
    />
  )
}

export interface DataTableProps<TData extends RowData, TValue> {
  columns: readonly ColumnDef<TData, TValue>[]
  data: readonly TData[]
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
  globalSearch?: DataTableGlobalSearch<TData>
  searchFields?: readonly DataTableSearchField<TData>[]
  filterFields?: readonly DataTableFilterField<TData>[]
  toolbarActions?: React.ReactNode
  emptyState?: React.ReactNode
  emptyActionLabel?: string
  emptyActionIcon?: React.ReactNode
  onEmptyAction?: () => void
  filteredEmptyState?: React.ReactNode
  loadingState?: React.ReactNode
  errorState?: React.ReactNode
  emptyAction?: DataTableStateAction
  onRetry?: () => void
  loadingAnnouncement?: string
  refetchAnnouncement?: string
  isLoading?: boolean
  error?: Error | string | null
  initialPageSize?: number
  pageSizeOptions?: readonly number[]
  enablePagination?: boolean
  enableExport?: boolean
  enableRowSelection?: boolean
  enableViewOptions?: boolean
  manualFiltering?: boolean
  manualPagination?: boolean
  manualSorting?: boolean
  pageCount?: number
  rowCount?: number
  sourceRowCount?: number
  selectedRowCount?: number
  rowSelection?: RowSelectionState
  columnVisibility?: VisibilityState
  defaultColumnVisibility?: VisibilityState
  columnVisibilityStorageKey?: string
  tableStateStorageKey?: string
  columnFilters?: ColumnFiltersState
  sorting?: SortingState
  pagination?: PaginationState
  globalFilterValue?: string
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  onSortingChange?: OnChangeFn<SortingState>
  onPaginationChange?: OnChangeFn<PaginationState>
  onGlobalFilterChange?: OnChangeFn<string>
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  getRowId,
  globalSearch,
  searchFields,
  filterFields,
  toolbarActions,
  emptyState,
  emptyActionLabel,
  emptyActionIcon,
  onEmptyAction,
  filteredEmptyState,
  loadingState,
  errorState,
  emptyAction,
  onRetry,
  loadingAnnouncement = dataTableCopy.loading.initialAnnouncement,
  refetchAnnouncement = dataTableCopy.loading.refetchAnnouncement,
  isLoading = false,
  error = null,
  initialPageSize = DATA_TABLE_INITIAL_PAGE_SIZE,
  pageSizeOptions = DATA_TABLE_PAGE_SIZE_OPTIONS,
  enablePagination = true,
  enableExport = true,
  enableRowSelection = false,
  enableViewOptions = true,
  manualFiltering = false,
  manualPagination = false,
  manualSorting = false,
  pageCount,
  rowCount,
  sourceRowCount,
  selectedRowCount: controlledSelectedRowCount,
  rowSelection: controlledRowSelection,
  columnVisibility: controlledColumnVisibility,
  defaultColumnVisibility,
  columnVisibilityStorageKey,
  tableStateStorageKey,
  columnFilters: controlledColumnFilters,
  sorting: controlledSorting,
  pagination: controlledPagination,
  globalFilterValue,
  onRowSelectionChange,
  onColumnVisibilityChange,
  onColumnFiltersChange,
  onSortingChange,
  onPaginationChange,
  onGlobalFilterChange,
}: DataTableProps<TData, TValue>) {
  const safeInitialPageSize = normalizePositiveInteger(
    initialPageSize,
    DATA_TABLE_PAGE_SIZE_OPTIONS[0]
  )
  const [rowSelection, setRowSelection] = useControllableDataTableState<RowSelectionState>({
    controlledValue: controlledRowSelection,
    defaultValue: {},
    onChange: onRowSelectionChange,
    storageKey: tableStateStorageKey,
    storageAdapter: dataTableRowSelectionStateAdapter,
  })
  const [columnVisibility, setColumnVisibility] = useControllableDataTableState<VisibilityState>({
    controlledValue: controlledColumnVisibility,
    defaultValue: defaultColumnVisibility ?? {},
    onChange: onColumnVisibilityChange,
    storageKey: tableStateStorageKey ?? columnVisibilityStorageKey,
    storageAdapter: tableStateStorageKey || columnVisibilityStorageKey
      ? dataTableColumnVisibilityStateAdapter
      : undefined,
  })
  const [columnFilters, setColumnFilters] = useControllableDataTableState<ColumnFiltersState>({
    controlledValue: controlledColumnFilters,
    defaultValue: [],
    onChange: onColumnFiltersChange,
    storageKey: tableStateStorageKey,
    storageAdapter: dataTableColumnFiltersStateAdapter,
  })
  const [sorting, setSorting] = useControllableDataTableState<SortingState>({
    controlledValue: controlledSorting,
    defaultValue: [],
    onChange: onSortingChange,
    storageKey: tableStateStorageKey,
    storageAdapter: dataTableSortingStateAdapter,
  })
  const [globalFilter, setGlobalFilter] = useControllableDataTableState<string>({
    controlledValue: globalFilterValue,
    defaultValue: "",
    onChange: onGlobalFilterChange,
    storageKey: tableStateStorageKey,
    storageAdapter: dataTableGlobalFilterStateAdapter,
  })
  const [pagination, setPagination] = useControllableDataTableState<PaginationState>({
    controlledValue: controlledPagination,
    defaultValue: {
      pageIndex: 0,
      pageSize: safeInitialPageSize,
    },
    onChange: onPaginationChange,
    storageKey: tableStateStorageKey,
    storageAdapter: dataTablePaginationStateAdapter,
  })

  const normalizedData = React.useMemo(() => [...data], [data])
  const normalizedColumns = React.useMemo(() => [...columns], [columns])
  const normalizedPageSizeOptions = React.useMemo(() => {
    const options = new Set(
      [safeInitialPageSize, ...pageSizeOptions].filter(
        (value) => Number.isInteger(value) && value > 0
      )
    )

    return Array.from(options).sort((a, b) => a - b)
  }, [pageSizeOptions, safeInitialPageSize])
  const normalizedPagination = React.useMemo<PaginationState>(() => {
    const pageSize = normalizedPageSizeOptions.includes(pagination.pageSize)
      ? pagination.pageSize
      : safeInitialPageSize
    const pageIndex =
      Number.isInteger(pagination.pageIndex) && pagination.pageIndex >= 0
        ? pagination.pageIndex
        : 0

    return {
      pageIndex,
      pageSize,
    }
  }, [normalizedPageSizeOptions, pagination, safeInitialPageSize])
  const searchableColumnIds = React.useMemo(
    () => dedupeGlobalSearchColumnIds(globalSearch),
    [globalSearch]
  )
  const normalizedGlobalSearch = React.useMemo(
    () =>
      globalSearch && searchableColumnIds.length > 0
        ? {
          ...globalSearch,
          columnIds: searchableColumnIds,
        }
        : undefined,
    [globalSearch, searchableColumnIds]
  )
  const normalizedSearchFields = React.useMemo(
    () => normalizedGlobalSearch ? [] : dedupeSearchFields(searchFields),
    [normalizedGlobalSearch, searchFields]
  )
  const normalizedFilterFields = React.useMemo(
    () => dedupeFilterFields(filterFields),
    [filterFields]
  )
  const filterFieldIds = React.useMemo(
    () => new Set(normalizedFilterFields.map((field) => String(field.id))),
    [normalizedFilterFields]
  )
  const enhancedColumns = React.useMemo(
    () =>
      normalizedColumns.map((column) => {
        const columnId =
          "id" in column && typeof column.id === "string"
            ? column.id
            : "accessorKey" in column && typeof column.accessorKey === "string"
              ? column.accessorKey
              : ""

        if (!columnId || !filterFieldIds.has(columnId) || column.filterFn) {
          return column
        }

        return {
          ...column,
          filterFn: includesSelectedValue,
        }
      }),
    [filterFieldIds, normalizedColumns]
  )
  const searchFieldIds = React.useMemo(
    () => new Set(normalizedSearchFields.map((field) => field.id)),
    [normalizedSearchFields]
  )
  const facetedFilterOptions = React.useMemo(() => {
    return new Map(
      normalizedFilterFields.map((field) => [
        field.id,
        new Set(field.options.map((option) => option.value)),
      ])
    )
  }, [normalizedFilterFields])
  const sanitizeColumnFilters = React.useCallback(
    (filters: ColumnFiltersState): ColumnFiltersState => {
      return filters.flatMap((filter) => {
        if (searchFieldIds.has(filter.id as DataTableColumnId<TData>)) {
          const value =
            typeof filter.value === "string"
              ? normalizeSearchValue(filter.value)
              : ""

          return value ? [{ ...filter, value }] : []
        }

        const allowedValues = facetedFilterOptions.get(
          filter.id as DataTableColumnId<TData>
        )

        if (allowedValues) {
          const values = Array.isArray(filter.value)
            ? dedupeStrings(filter.value.map(String)).filter((value) =>
              allowedValues.has(value)
            )
            : []

          return values.length ? [{ ...filter, value: values }] : []
        }

        return isEmptyFilterValue(filter.value) ? [] : [filter]
      })
    },
    [facetedFilterOptions, searchFieldIds]
  )
  const sanitizedColumnFilters = React.useMemo(
    () => sanitizeColumnFilters(columnFilters),
    [columnFilters, sanitizeColumnFilters]
  )
  const isColumnFiltered = sanitizedColumnFilters.length > 0
  const isGlobalFiltered = normalizeSearchValue(globalFilter).length > 0
  const isFiltered = isColumnFiltered || isGlobalFiltered
  const tableData = React.useMemo(() => {
    const query = normalizeFilterText(globalFilter)

    if (manualFiltering || !query || searchableColumnIds.length === 0) {
      return normalizedData
    }

    return normalizedData.filter((row) =>
      searchableColumnIds.some((columnId) => {
        const value = (row as Record<DataTableColumnId<TData>, unknown>)[
          columnId
        ]

        return normalizeFilterText(value).includes(query)
      })
    )
  }, [globalFilter, manualFiltering, normalizedData, searchableColumnIds])
  const handlePaginationChange = React.useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      setPagination(updater)
    },
    [setPagination]
  )
  const resetPageIndex = React.useCallback(() => {
    handlePaginationChange((previous) => {
      if (previous.pageIndex === 0) {
        return previous
      }

      return { ...previous, pageIndex: 0 }
    })
  }, [handlePaginationChange])
  const handleSortingChange = React.useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting(updater)
      resetPageIndex()
    },
    [resetPageIndex, setSorting]
  )
  const handleColumnFiltersChange =
    React.useCallback<OnChangeFn<ColumnFiltersState>>(
      (updater) => {
        const sanitizedUpdater = (
          previous: ColumnFiltersState
        ): ColumnFiltersState => {
          const nextFilters =
            typeof updater === "function" ? updater(previous) : updater

          return sanitizeColumnFilters(nextFilters)
        }

        setColumnFilters(sanitizedUpdater)
        resetPageIndex()
      },
      [resetPageIndex, sanitizeColumnFilters, setColumnFilters]
    )
  const handleGlobalFilterChange = React.useCallback<OnChangeFn<string>>(
    (updater) => {
      setGlobalFilter((previous) =>
        typeof updater === "function" ? updater(previous) : updater
      )
      resetPageIndex()
    },
    [resetPageIndex, setGlobalFilter]
  )
  const handleRowSelectionChange =
    React.useCallback<OnChangeFn<RowSelectionState>>(
      (updater) => {
        setRowSelection(updater)
      },
      [setRowSelection]
    )
  const handleColumnVisibilityChange =
    React.useCallback<OnChangeFn<VisibilityState>>(
      (updater) => {
        setColumnVisibility(updater)
      },
      [setColumnVisibility]
    )
  const manualPaginationMeta = manualPagination
    ? pageCount !== undefined
      ? { pageCount }
      : rowCount !== undefined
        ? { rowCount }
        : {}
    : {}

  const table = useReactTable<TData>({
    data: tableData,
    columns: enhancedColumns,
    getRowId,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: sanitizedColumnFilters,
      pagination: normalizedPagination,
    },
    enableRowSelection,
    manualFiltering,
    manualPagination,
    manualSorting,
    ...manualPaginationMeta,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    ...(!manualFiltering
      ? {
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
      }
      : {}),
    ...(!manualSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(enablePagination && !manualPagination
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
  })

  const tableRows = table.getRowModel().rows
  const datasetRowCount = manualPagination
    ? rowCount ?? normalizedData.length
    : sourceRowCount ?? normalizedData.length
  const hasDatasetRows = datasetRowCount > 0
  const hasVisibleRows = tableRows.length > 0
  const hasError = Boolean(error)
  const hasBlockingError = hasError && !isLoading && !hasVisibleRows
  const hasNonBlockingError = hasError && !isLoading && hasVisibleRows
  const isInitialLoading = isLoading && !hasVisibleRows && !hasDatasetRows
  const shouldRenderInitialSkeleton =
    isLoading && !loadingState && !hasVisibleRows
  const shouldRenderControls =
    !hasBlockingError && !isInitialLoading && hasDatasetRows
  const handleClearFilters = React.useCallback(() => {
    table.resetColumnFilters()
    handleGlobalFilterChange("")
  }, [handleGlobalFilterChange, table])
  const handleRetry = React.useCallback(() => {
    if (onRetry) {
      onRetry()
      return
    }

    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }, [onRetry])
  const errorAction = React.useMemo<DataTableStateAction>(
    () => ({
      label: dataTableCopy.fallback.errorAction,
      icon: <RefreshCcwIcon aria-hidden="true" />,
      onClick: handleRetry,
    }),
    [handleRetry]
  )
  const filteredAction = React.useMemo<DataTableStateAction>(
    () => ({
      label: dataTableCopy.fallback.filteredEmptyAction,
      icon: <ListRestartIcon aria-hidden="true" />,
      onClick: handleClearFilters,
    }),
    [handleClearFilters]
  )
  const resolvedEmptyAction = React.useMemo<DataTableStateAction | undefined>(() => {
    if (emptyAction) {
      return emptyAction
    }

    if (!emptyActionLabel || !onEmptyAction) {
      return undefined
    }

    return {
      label: emptyActionLabel,
      icon: emptyActionIcon ?? <PlusIcon aria-hidden="true" />,
      onClick: onEmptyAction,
    }
  }, [emptyAction, emptyActionIcon, emptyActionLabel, onEmptyAction])

  const defaultErrorState = (
    <DataTableDefaultState
      title={dataTableCopy.fallback.errorTitle}
      description={dataTableCopy.fallback.errorDescription}
      icon={<RefreshCcwIcon />}
      action={errorAction}
    />
  )
  const defaultEmptyState = (
    <DataTableDefaultState
      title={dataTableCopy.fallback.emptyTitle}
      description={dataTableCopy.fallback.emptyDescription}
      icon={<DatabaseIcon />}
      action={resolvedEmptyAction}
    />
  )
  const defaultFilteredEmptyState = (
    <DataTableDefaultState
      title={dataTableCopy.fallback.filteredEmptyTitle}
      description={dataTableCopy.fallback.filteredEmptyDescription}
      icon={<SearchXIcon />}
      action={filteredAction}
    />
  )
  const visibleRows = hasBlockingError ? [] : tableRows
  const visibleLeafColumns = table.getVisibleLeafColumns()
  const visibleColumnCount = Math.max(visibleLeafColumns.length, 1)
  const skeletonColumnSizes = React.useMemo(
    () => visibleLeafColumns.map((column) => column.getSize()),
    [visibleLeafColumns]
  )
  const paginationPageSize = table.getState().pagination.pageSize
  const skeletonRowCount = React.useMemo(
    () => resolveInitialSkeletonRowCount(paginationPageSize),
    [paginationPageSize]
  )
  const currentRowCount = manualPagination
    ? rowCount ?? tableData.length
    : manualFiltering
      ? normalizedData.length
      : table.getFilteredRowModel().rows.length
  const selectedRowCount =
    controlledSelectedRowCount ??
    (enableRowSelection
      ? manualFiltering || manualPagination
        ? table.getSelectedRowModel().rows.length
        : table.getFilteredSelectedRowModel().rows.length
      : 0)
  const shouldRenderStatePanel =
    !shouldRenderInitialSkeleton &&
    !visibleRows.length
  const stateKind = hasBlockingError ? "error" : isLoading ? "loading" : "empty"
  const stateContent = hasBlockingError
    ? errorState ?? defaultErrorState
    : isLoading
      ? loadingState
      : hasDatasetRows && isFiltered
        ? filteredEmptyState ?? defaultFilteredEmptyState
        : emptyState ?? defaultEmptyState

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-4"
      aria-busy={isLoading || undefined}
    >
      {hasNonBlockingError ? (
        <div
          className="rounded-md border p-4"
          role="alert"
          aria-live="assertive"
        >
          {errorState ?? defaultErrorState}
        </div>
      ) : null}

      {shouldRenderControls ? (
        <DataTableToolbar
          table={table}
          globalSearch={normalizedGlobalSearch}
          searchFields={normalizedSearchFields}
          filterFields={normalizedFilterFields}
          actions={toolbarActions}
          enableViewOptions={enableViewOptions}
          enableExport={enableExport}
          canExport={visibleRows.length > 0}
          manualFiltering={manualFiltering}
          isLoading={isLoading}
          globalFilterValue={globalFilter}
          onGlobalFilterChange={handleGlobalFilterChange}
          onClearFilters={handleClearFilters}
        />
      ) : null}

      {isLoading && !loadingState ? (
        <span className="sr-only" role="status" aria-live="polite">
          {shouldRenderInitialSkeleton
            ? loadingAnnouncement
            : refetchAnnouncement}
        </span>
      ) : null}

      <div className="flex min-h-0 min-w-0 shrink flex-col overflow-hidden rounded-md border">
        {shouldRenderInitialSkeleton || visibleRows.length > 0 ? (
          <DataTableScrollContainer className="min-h-0 w-full max-h-full max-w-full">
            <Table className="min-w-max" aria-rowcount={currentRowCount} aria-colcount={visibleColumnCount}>
              <caption className="sr-only">
                {currentRowCount} {currentRowCount === 1 ? "registro" : "registros"}
                {isFiltered ? " (filtrado)" : ""}
              </caption>
              <TableHeader className="sticky top-0 z-20 bg-background">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-background">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.getSize() }}
                        className="bg-background"
                        aria-sort={getHeaderAriaSort(header)}
                      >
                        {header.isPlaceholder
                          ? null
                          : typeof header.column.columnDef.header === "string"
                            ? (
                              <DataTableColumnHeader
                                column={header.column}
                                title={header.column.columnDef.header}
                              />
                            )
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {shouldRenderInitialSkeleton ? (
                  <DataTableLoadingSkeleton
                    columnCount={visibleColumnCount}
                    rowCount={skeletonRowCount}
                    columnSizes={skeletonColumnSizes}
                  />
                ) : visibleRows.length > 0 ? (
                  visibleRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={isLoading ? "opacity-60" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  null
                )}
              </TableBody>
            </Table>
          </DataTableScrollContainer>
        ) : null}

        {shouldRenderStatePanel ? (
          <DataTableStatePanel kind={stateKind}>
            {stateContent}
          </DataTableStatePanel>
        ) : null}
      </div>

      {enablePagination && shouldRenderControls && hasVisibleRows ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={normalizedPageSizeOptions}
          rowCount={currentRowCount}
          selectedRowCount={selectedRowCount}
          showSelectedCount={enableRowSelection}
        />
      ) : null}
    </div>
  )
}
