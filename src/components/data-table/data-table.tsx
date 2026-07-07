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
import { Database, RefreshCcw, SearchX, X } from "lucide-react"
import * as React from "react"

import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTableColumnHeader } from "./data-table-column-header"
import { dataTableCopy } from "./data-table-copy"
import { DataTableEmptyState } from "./data-table-empty-state"
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
} from "./data-table-types"

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 25, 30, 40, 50]
const DEFAULT_INITIAL_SKELETON_ROWS = 8
const MAX_INITIAL_SKELETON_ROWS = 10
const MIN_INITIAL_SKELETON_ROWS = 4
const APPROX_SKELETON_ROW_HEIGHT = 44
const APPROX_SKELETON_RESERVED_SPACE = 420

function normalizePositiveInteger(value: number, fallback: number) {
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function resolveInitialSkeletonRowCount(pageSize: number) {
  const safePageSize = normalizePositiveInteger(
    pageSize,
    DEFAULT_INITIAL_SKELETON_ROWS
  )

  if (typeof window === "undefined") {
    return Math.min(safePageSize, DEFAULT_INITIAL_SKELETON_ROWS)
  }

  const viewportBasedRows = Math.floor(
    (window.innerHeight - APPROX_SKELETON_RESERVED_SPACE) /
    APPROX_SKELETON_ROW_HEIGHT
  )
  const safeViewportRows = normalizePositiveInteger(
    viewportBasedRows,
    DEFAULT_INITIAL_SKELETON_ROWS
  )

  return Math.max(
    MIN_INITIAL_SKELETON_ROWS,
    Math.min(safePageSize, safeViewportRows, MAX_INITIAL_SKELETON_ROWS)
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

function resolveDataTableStateContent({
  isLoading,
  isFiltered,
  loadingState,
  emptyState,
  filteredEmptyState,
  defaultEmptyState,
  defaultFilteredEmptyState,
}: {
  isLoading: boolean
  isFiltered: boolean
  loadingState?: React.ReactNode
  emptyState?: React.ReactNode
  filteredEmptyState?: React.ReactNode
  defaultEmptyState: React.ReactNode
  defaultFilteredEmptyState: React.ReactNode
}) {
  if (isLoading) {
    return loadingState
  }

  if (isFiltered) {
    return filteredEmptyState ?? defaultFilteredEmptyState
  }

  return emptyState ?? defaultEmptyState
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
  filteredEmptyState?: React.ReactNode
  loadingState?: React.ReactNode
  errorState?: React.ReactNode
  onRetry?: () => void
  loadingAnnouncement?: string
  refetchAnnouncement?: string
  isLoading?: boolean
  error?: Error | string | null
  initialPageSize?: number
  pageSizeOptions?: readonly number[]
  enablePagination?: boolean
  enableRowSelection?: boolean
  enableViewOptions?: boolean
  manualFiltering?: boolean
  manualPagination?: boolean
  manualSorting?: boolean
  pageCount?: number
  rowCount?: number
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
  filteredEmptyState,
  loadingState,
  errorState,
  onRetry,
  loadingAnnouncement = dataTableCopy.loading.initialAnnouncement,
  refetchAnnouncement = dataTableCopy.loading.refetchAnnouncement,
  isLoading = false,
  error = null,
  initialPageSize = 25,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  enablePagination = true,
  enableRowSelection = false,
  enableViewOptions = true,
  manualFiltering = false,
  manualPagination = false,
  manualSorting = false,
  pageCount,
  rowCount,
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
    DEFAULT_PAGE_SIZE_OPTIONS[0]
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
    () => dedupeSearchFields(searchFields),
    [searchFields]
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
      const sanitizedUpdater = (previous: string): string => {
        const nextValue =
          typeof updater === "function" ? updater(previous) : updater

        return nextValue
      }

      setGlobalFilter(sanitizedUpdater)
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
  const hasSourceRows = normalizedData.length > 0
  const datasetRowCount = manualPagination
    ? rowCount ?? normalizedData.length
    : normalizedData.length
  const hasDatasetRows = datasetRowCount > 0
  const hasVisibleRows = tableRows.length > 0
  const hasError = Boolean(error)
  const hasBlockingError = hasError && !isLoading && !hasSourceRows
  const hasNonBlockingError = hasError && !isLoading && hasSourceRows
  const shouldRenderInitialSkeleton =
    isLoading && !loadingState && !hasVisibleRows
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
  const defaultErrorState = (
    <DataTableEmptyState
      title={dataTableCopy.fallback.errorTitle}
      description={dataTableCopy.fallback.errorDescription}
      icon={<RefreshCcw />}
      actionLabel={dataTableCopy.fallback.errorAction}
      actionIcon={<RefreshCcw />}
      onAction={handleRetry}
    />
  )
  const defaultEmptyState = (
    <DataTableEmptyState
      title={dataTableCopy.fallback.emptyTitle}
      description={dataTableCopy.fallback.emptyDescription}
      icon={<Database />}
    />
  )
  const defaultFilteredEmptyState = (
    <DataTableEmptyState
      title={dataTableCopy.fallback.filteredEmptyTitle}
      description={dataTableCopy.fallback.filteredEmptyDescription}
      icon={<SearchX />}
      actionLabel={dataTableCopy.fallback.filteredEmptyAction}
      actionIcon={<X />}
      onAction={handleClearFilters}
    />
  )
  const stateKind = isLoading ? "loading" : "empty"
  const stateContent = resolveDataTableStateContent({
    isLoading,
    isFiltered: hasDatasetRows && isFiltered,
    loadingState,
    emptyState,
    filteredEmptyState,
    defaultEmptyState,
    defaultFilteredEmptyState,
  })
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
  const shouldRenderTableControls = true
  const shouldRenderTableEmptyRow =
    !shouldRenderInitialSkeleton && !visibleRows.length
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

  if (hasBlockingError) {
    return (
      <div className="flex min-h-0 flex-1 rounded-md border p-6" role="alert" aria-live="assertive">
        {errorState ?? defaultErrorState}
      </div>
    )
  }

  const tableContent = (
    <>
      {hasNonBlockingError ? (
        <div
          className="rounded-md border p-4"
          role="alert"
          aria-live="assertive"
        >
          {errorState ?? defaultErrorState}
        </div>
      ) : null}

      {shouldRenderTableControls ? (
        <>
          <Separator />

          <DataTableToolbar
            table={table}
            globalSearch={normalizedGlobalSearch}
            searchFields={normalizedSearchFields}
            filterFields={normalizedFilterFields}
            actions={toolbarActions}
            enableViewOptions={enableViewOptions}
            manualFiltering={manualFiltering}
            isLoading={isLoading}
            globalFilterValue={globalFilter}
            onGlobalFilterChange={handleGlobalFilterChange}
            onClearFilters={handleClearFilters}
          />
        </>
      ) : null}

      {isLoading && !loadingState ? (
        <span className="sr-only" role="status" aria-live="polite">
          {shouldRenderInitialSkeleton
            ? loadingAnnouncement
            : refetchAnnouncement}
        </span>
      ) : null}

      <DataTableScrollContainer className="min-h-0 flex-1">
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
            ) : shouldRenderTableEmptyRow ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-[320px] p-6 align-middle">
                  <div
                    role={stateKind === "loading" ? "status" : undefined}
                    aria-live={stateKind === "loading" ? "polite" : undefined}
                    className="mx-auto flex h-full w-full max-w-md items-center justify-center"
                  >
                    {stateContent}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
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
            )}
          </TableBody>
        </Table>
      </DataTableScrollContainer>

      {enablePagination && shouldRenderTableControls ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={normalizedPageSizeOptions}
          rowCount={currentRowCount}
          selectedRowCount={selectedRowCount}
          showSelectedCount={enableRowSelection}
        />
      ) : null}
    </>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4" aria-busy="true">
        {tableContent}
      </div>
    )
  }

  return <div className="flex min-h-0 flex-1 flex-col gap-4">{tableContent}</div>
}
