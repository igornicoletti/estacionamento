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
import {
  ChevronDownIcon,
  DatabaseIcon,
  ListRestartIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
  resolveDataTableSkeletonRowCount,
} from "./data-table-constants"
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
} from "./data-table-filter-utils"
import { DataTableLoadingSkeleton } from "./data-table-loading-skeleton"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableScrollContainer } from "./data-table-scroll-container"
import {
  dataTableColumnVisibilityStateAdapter,
  dataTablePaginationStateAdapter,
  dataTableSortingStateAdapter,
  useControllableDataTableState,
} from "./data-table-state"
import { DataTableToolbar } from "./data-table-toolbar"
import {
  type DataTableFilterField,
  type DataTableGlobalSearch,
  type DataTableSearchField,
  type DataTableStateAction,
} from "./data-table-types"

const DEFAULT_TABLE_ARIA_LABEL = "Tabela de dados"

type DataTableSurface = "card" | "plain"
type DataTableStateKind = "empty" | "error" | "loading"

function isPositiveSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  )
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  )
}

function normalizeVisibleText(value: string | undefined): string {
  return (
    value
      ?.trim()
      .replace(/\s+/gu, " ")
      .normalize("NFC") ?? ""
  )
}

function resolveInitialPageSize(
  initialPageSize: number,
  pageSizeOptions: readonly number[]
): number {
  if (isPositiveSafeInteger(initialPageSize)) {
    return initialPageSize
  }

  return (
    pageSizeOptions.find(isPositiveSafeInteger) ??
    DATA_TABLE_INITIAL_PAGE_SIZE
  )
}

function normalizePageSizeOptions(
  pageSizeOptions: readonly number[],
  initialPageSize: number
): number[] {
  const options = new Set<number>()

  for (const pageSize of [initialPageSize, ...pageSizeOptions]) {
    if (isPositiveSafeInteger(pageSize)) {
      options.add(pageSize)
    }
  }

  if (options.size === 0) {
    options.add(DATA_TABLE_INITIAL_PAGE_SIZE)
  }

  return Array.from(options).sort((left, right) => left - right)
}

function normalizePaginationState(
  pagination: PaginationState,
  pageSizeOptions: readonly number[],
  fallbackPageSize: number
): PaginationState {
  return {
    pageIndex: isNonNegativeSafeInteger(pagination.pageIndex)
      ? pagination.pageIndex
      : 0,
    pageSize:
      isPositiveSafeInteger(pagination.pageSize) &&
        pageSizeOptions.includes(pagination.pageSize)
        ? pagination.pageSize
        : fallbackPageSize,
  }
}

function normalizeOptionalRowCount(
  value: number | undefined,
  fallback: number
): number {
  return isNonNegativeSafeInteger(value) ? value : fallback
}

function getHeaderAriaSort<TData, TValue>(
  header: Header<TData, TValue>
) {
  const sortState = header.column.getIsSorted()

  if (sortState === "asc") {
    return "ascending" as const
  }

  if (sortState === "desc") {
    return "descending" as const
  }

  return undefined
}

function resolveColumnDefinitionId<TData, TValue>(
  column: ColumnDef<TData, TValue>
): string | null {
  if ("id" in column && typeof column.id === "string") {
    return column.id
  }

  if (
    "accessorKey" in column &&
    typeof column.accessorKey === "string"
  ) {
    return column.accessorKey
  }

  return null
}

function applyFacetedFilterFunctions<TData, TValue>(
  columns: readonly ColumnDef<TData, TValue>[],
  filterFieldIds: ReadonlySet<string>
): ColumnDef<TData, TValue>[] {
  return columns.map((column) => {
    const columnId = resolveColumnDefinitionId(column)

    if (
      !columnId ||
      !filterFieldIds.has(columnId) ||
      column.filterFn
    ) {
      return column
    }

    return {
      ...column,
      filterFn: includesSelectedValue,
    }
  })
}

function createAllowedFacetedValues<TData>(
  filterFields: readonly DataTableFilterField<TData>[]
): ReadonlyMap<string, ReadonlySet<string>> {
  return new Map(
    filterFields.map((field) => {
      const optionValues = [
        ...field.options.map((option) => option.value),
        ...(field.groups?.flatMap((group) =>
          group.options.map((option) => option.value)
        ) ?? []),
      ]

      return [String(field.id), new Set(optionValues)] as const
    })
  )
}

function sanitizeColumnFiltersState(
  filters: ColumnFiltersState,
  searchFieldIds: ReadonlySet<string>,
  allowedFacetedValues: ReadonlyMap<string, ReadonlySet<string>>
): ColumnFiltersState {
  return filters.flatMap((filter) => {
    if (searchFieldIds.has(filter.id)) {
      if (
        typeof filter.value !== "string" ||
        normalizeFilterText(filter.value).length === 0
      ) {
        return []
      }

      return [filter]
    }

    const allowedValues = allowedFacetedValues.get(filter.id)

    if (allowedValues) {
      if (!Array.isArray(filter.value)) {
        return []
      }

      const selectedValues = dedupeStrings(
        filter.value.filter(
          (value): value is string => typeof value === "string"
        )
      ).filter((value) => allowedValues.has(value))

      return selectedValues.length > 0
        ? [{ ...filter, value: selectedValues }]
        : []
    }

    return isEmptyFilterValue(filter.value) ? [] : [filter]
  })
}

function normalizedGlobalFilter<TData extends RowData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown
): boolean {
  const query = normalizeFilterText(filterValue)

  if (query.length === 0) {
    return true
  }

  return normalizeFilterText(row.getValue(columnId)).includes(query)
}

function resolveStateActionProps(action: DataTableStateAction | undefined) {
  return action
    ? {
      actionLabel: action.label,
      actionIcon: action.icon,
      onAction: action.onClick,
    }
    : {}
}

function DataTableStatePanel({
  children,
  kind,
}: {
  children: React.ReactNode
  kind: DataTableStateKind
}) {
  const isLiveRegion = kind === "loading" || kind === "error"

  return (
    <div
      role={
        kind === "error"
          ? "alert"
          : kind === "loading"
            ? "status"
            : undefined
      }
      aria-live={
        isLiveRegion
          ? kind === "error"
            ? "assertive"
            : "polite"
          : undefined
      }
      className="flex min-h-48 flex-1 items-center justify-center px-3 py-8 sm:min-h-64 sm:px-4 sm:py-10"
    >
      <div className="w-full max-w-sm sm:max-w-md">{children}</div>
    </div>
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
    <DataTableEmptyState
      title={title}
      description={description}
      icon={icon}
      {...resolveStateActionProps(action)}
    />
  )
}

export interface DataTableProps<TData extends RowData, TValue> {
  columns: readonly ColumnDef<TData, TValue>[]
  data: readonly TData[]
  surface?: DataTableSurface
  ariaLabel?: string
  getRowId?: (
    originalRow: TData,
    index: number,
    parent?: Row<TData>
  ) => string
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
  canExport?: boolean
  allowExportWhileLoading?: boolean
  enableRowSelection?: boolean
  enableViewOptions?: boolean
  isExternallyFiltered?: boolean
  manualFiltering?: boolean
  manualPagination?: boolean
  manualSorting?: boolean
  pageCount?: number
  rowCount?: number
  sourceRowCount?: number
  selectedRowCount?: number
  selectionRowCount?: number
  canPreviousPage?: boolean
  canNextPage?: boolean
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
  surface = "card",
  ariaLabel,
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
  enableExport = false,
  canExport,
  allowExportWhileLoading = false,
  enableRowSelection = false,
  enableViewOptions = true,
  isExternallyFiltered = false,
  manualFiltering = false,
  manualPagination = false,
  manualSorting = false,
  pageCount,
  rowCount,
  sourceRowCount,
  selectedRowCount: controlledSelectedRowCount,
  selectionRowCount,
  canPreviousPage,
  canNextPage,
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
  const resolvedAriaLabel =
    normalizeVisibleText(ariaLabel) || DEFAULT_TABLE_ARIA_LABEL

  const safeInitialPageSize = resolveInitialPageSize(
    initialPageSize,
    pageSizeOptions
  )

  const normalizedPageSizeOptions = React.useMemo(
    () => normalizePageSizeOptions(pageSizeOptions, safeInitialPageSize),
    [pageSizeOptions, safeInitialPageSize]
  )

  const [rowSelection, setRowSelection] =
    useControllableDataTableState<RowSelectionState>({
      controlledValue: controlledRowSelection,
      defaultValue: {},
      onChange: onRowSelectionChange,
    })

  const [columnVisibility, setColumnVisibility] =
    useControllableDataTableState<VisibilityState>({
      controlledValue: controlledColumnVisibility,
      defaultValue: defaultColumnVisibility ?? {},
      onChange: onColumnVisibilityChange,
      storageKey: tableStateStorageKey ?? columnVisibilityStorageKey,
      storageAdapter:
        tableStateStorageKey || columnVisibilityStorageKey
          ? dataTableColumnVisibilityStateAdapter
          : undefined,
    })

  const [columnFilters, setColumnFilters] =
    useControllableDataTableState<ColumnFiltersState>({
      controlledValue: controlledColumnFilters,
      defaultValue: [],
      onChange: onColumnFiltersChange,
    })

  const [sorting, setSorting] =
    useControllableDataTableState<SortingState>({
      controlledValue: controlledSorting,
      defaultValue: [],
      onChange: onSortingChange,
      storageKey: tableStateStorageKey,
      storageAdapter: dataTableSortingStateAdapter,
    })

  const [globalFilter, setGlobalFilter] =
    useControllableDataTableState<string>({
      controlledValue: globalFilterValue,
      defaultValue: "",
      onChange: onGlobalFilterChange,
    })

  const [pagination, setPagination] =
    useControllableDataTableState<PaginationState>({
      controlledValue: controlledPagination,
      defaultValue: {
        pageIndex: 0,
        pageSize: safeInitialPageSize,
      },
      onChange: onPaginationChange,
      storageKey: tableStateStorageKey,
      storageAdapter: dataTablePaginationStateAdapter,
    })

  const normalizedPagination = React.useMemo(
    () =>
      normalizePaginationState(
        pagination,
        normalizedPageSizeOptions,
        safeInitialPageSize
      ),
    [normalizedPageSizeOptions, pagination, safeInitialPageSize]
  )

  const tableData = React.useMemo(() => Array.from(data), [data])
  const baseColumns = React.useMemo(() => Array.from(columns), [columns])

  const searchableColumnIds = React.useMemo(
    () => dedupeGlobalSearchColumnIds(globalSearch),
    [globalSearch]
  )

  const searchableColumnIdSet = React.useMemo(
    () => new Set(searchableColumnIds.map(String)),
    [searchableColumnIds]
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
    () =>
      new Set(
        normalizedFilterFields.map((field) => String(field.id))
      ),
    [normalizedFilterFields]
  )

  const tableColumns = React.useMemo(
    () => applyFacetedFilterFunctions(baseColumns, filterFieldIds),
    [baseColumns, filterFieldIds]
  )

  const searchFieldIds = React.useMemo(
    () =>
      new Set(
        normalizedSearchFields.map((field) => String(field.id))
      ),
    [normalizedSearchFields]
  )

  const allowedFacetedValues = React.useMemo(
    () => createAllowedFacetedValues(normalizedFilterFields),
    [normalizedFilterFields]
  )

  const sanitizeColumnFilters = React.useCallback(
    (filters: ColumnFiltersState) =>
      sanitizeColumnFiltersState(
        filters,
        searchFieldIds,
        allowedFacetedValues
      ),
    [allowedFacetedValues, searchFieldIds]
  )

  const sanitizedColumnFilters = React.useMemo(
    () => sanitizeColumnFilters(columnFilters),
    [columnFilters, sanitizeColumnFilters]
  )

  const isColumnFiltered = sanitizedColumnFilters.length > 0
  const isGlobalFiltered = normalizeFilterText(globalFilter).length > 0
  const isFiltered =
    isColumnFiltered || isGlobalFiltered || isExternallyFiltered

  const handlePaginationChange = React.useCallback<
    OnChangeFn<PaginationState>
  >(
    (updater) => {
      setPagination(updater)
    },
    [setPagination]
  )

  const resetPageIndex = React.useCallback(() => {
    handlePaginationChange((previous) =>
      previous.pageIndex === 0
        ? previous
        : {
          ...previous,
          pageIndex: 0,
        }
    )
  }, [handlePaginationChange])

  const handleSortingChange = React.useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      setSorting(updater)

      if (manualPagination) {
        resetPageIndex()
      }
    },
    [manualPagination, resetPageIndex, setSorting]
  )

  const handleColumnFiltersChange = React.useCallback<
    OnChangeFn<ColumnFiltersState>
  >(
    (updater) => {
      setColumnFilters((previous) => {
        const nextFilters =
          typeof updater === "function" ? updater(previous) : updater

        return sanitizeColumnFilters(nextFilters)
      })

      if (manualPagination) {
        resetPageIndex()
      }
    },
    [manualPagination, resetPageIndex, sanitizeColumnFilters, setColumnFilters]
  )

  const handleGlobalFilterChange = React.useCallback<OnChangeFn<string>>(
    (updater) => {
      setGlobalFilter(updater)

      if (manualPagination) {
        resetPageIndex()
      }
    },
    [manualPagination, resetPageIndex, setGlobalFilter]
  )

  const handleClearFilters = React.useCallback(() => {
    setColumnFilters([])
    setGlobalFilter("")
    resetPageIndex()
  }, [resetPageIndex, setColumnFilters, setGlobalFilter])

  const manualPaginationMeta = React.useMemo(() => {
    if (!manualPagination) {
      return {}
    }

    if (
      typeof pageCount === "number" &&
      Number.isSafeInteger(pageCount) &&
      pageCount >= -1
    ) {
      return { pageCount }
    }

    if (isNonNegativeSafeInteger(rowCount)) {
      return { rowCount }
    }

    return {}
  }, [manualPagination, pageCount, rowCount])

  const table = useReactTable<TData>({
    data: tableData,
    columns: tableColumns,
    getRowId,
    initialState: {
      columnVisibility: defaultColumnVisibility ?? {},
      pagination: {
        pageIndex: 0,
        pageSize: safeInitialPageSize,
      },
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: sanitizedColumnFilters,
      pagination: normalizedPagination,
      globalFilter,
    },
    enableRowSelection,
    enableGlobalFilter: searchableColumnIds.length > 0,
    getColumnCanGlobalFilter: (column) =>
      searchableColumnIdSet.has(column.id),
    globalFilterFn: normalizedGlobalFilter,
    manualFiltering,
    manualPagination,
    manualSorting,
    autoResetPageIndex: !manualPagination,
    ...manualPaginationMeta,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    ...(!manualFiltering
      ? {
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
      }
      : {}),
    ...(!manualSorting
      ? {
        getSortedRowModel: getSortedRowModel(),
      }
      : {}),
    ...(enablePagination && !manualPagination
      ? {
        getPaginationRowModel: getPaginationRowModel(),
      }
      : {}),
  })

  const visibleRows = table.getRowModel().rows
  const hasVisibleRows = visibleRows.length > 0

  const sourceTotalRowCount = normalizeOptionalRowCount(
    sourceRowCount,
    tableData.length
  )

  const currentRowCount = manualPagination
    ? normalizeOptionalRowCount(rowCount, tableData.length)
    : manualFiltering
      ? normalizeOptionalRowCount(rowCount, tableData.length)
      : table.getFilteredRowModel().rows.length

  const hasKnownRows =
    sourceTotalRowCount > 0 || currentRowCount > 0 || hasVisibleRows

  const hasError = Boolean(error)
  const hasBlockingError = hasError && !isLoading && !hasVisibleRows
  const hasNonBlockingError = hasError && !isLoading && hasVisibleRows
  const isInitialLoading = isLoading && !hasVisibleRows
  const shouldRenderInitialSkeleton =
    isInitialLoading && loadingState === undefined

  const hasToolbarSearch =
    Boolean(normalizedGlobalSearch) || normalizedSearchFields.length > 0
  const hasToolbarFilters = normalizedFilterFields.length > 0
  const hasToolbarActions = React.Children.toArray(toolbarActions).length > 0
  const hasToolbarUtilities = enableViewOptions || enableExport
  const hasToolbarSurface =
    hasToolbarSearch ||
    hasToolbarFilters ||
    hasToolbarActions ||
    hasToolbarUtilities

  const shouldRenderToolbar =
    !hasBlockingError &&
    !isInitialLoading &&
    hasToolbarSurface &&
    (hasKnownRows || isFiltered)

  const shouldRenderPagination =
    enablePagination && !hasBlockingError && hasVisibleRows

  const errorAction = React.useMemo<DataTableStateAction | undefined>(
    () =>
      onRetry
        ? {
          label: dataTableCopy.fallback.errorAction,
          icon: <RefreshCcwIcon aria-hidden="true" />,
          onClick: onRetry,
        }
        : undefined,
    [onRetry]
  )

  const filteredAction = React.useMemo<DataTableStateAction>(
    () => ({
      label: dataTableCopy.fallback.filteredEmptyAction,
      icon: <ListRestartIcon aria-hidden="true" />,
      onClick: handleClearFilters,
    }),
    [handleClearFilters]
  )

  const resolvedEmptyAction = React.useMemo<
    DataTableStateAction | undefined
  >(() => {
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
      icon={<RefreshCcwIcon aria-hidden="true" />}
      action={errorAction}
    />
  )

  const defaultEmptyState = (
    <DataTableDefaultState
      title={dataTableCopy.fallback.emptyTitle}
      description={dataTableCopy.fallback.emptyDescription}
      icon={<DatabaseIcon aria-hidden="true" />}
      action={resolvedEmptyAction}
    />
  )

  const defaultFilteredEmptyState = (
    <DataTableDefaultState
      title={dataTableCopy.fallback.filteredEmptyTitle}
      description={dataTableCopy.fallback.filteredEmptyDescription}
      icon={<SearchXIcon aria-hidden="true" />}
      action={filteredAction}
    />
  )

  const visibleLeafColumns = table.getVisibleLeafColumns()
  const visibleColumnCount = visibleLeafColumns.length
  const skeletonColumnCount = Math.max(visibleColumnCount, 1)

  const skeletonColumnSizes = React.useMemo(
    () => visibleLeafColumns.map((column) => column.getSize()),
    [visibleLeafColumns]
  )

  const skeletonRowCount = resolveDataTableSkeletonRowCount(
    table.getState().pagination.pageSize
  )

  const selectedRowCount =
    controlledSelectedRowCount ??
    (enableRowSelection
      ? manualFiltering || manualPagination
        ? table.getSelectedRowModel().rows.length
        : table.getFilteredSelectedRowModel().rows.length
      : 0)

  const shouldRenderStatePanel =
    !shouldRenderInitialSkeleton && !hasVisibleRows

  const stateKind: DataTableStateKind = hasBlockingError
    ? "error"
    : isLoading
      ? "loading"
      : "empty"

  const stateContent = hasBlockingError
    ? errorState ?? defaultErrorState
    : isLoading
      ? loadingState
      : isFiltered
        ? filteredEmptyState ?? defaultFilteredEmptyState
        : emptyState ?? defaultEmptyState

  const headerSurfaceClassName =
    surface === "card" ? "bg-card" : "bg-background"

  const caption = `${resolvedAriaLabel}. ${currentRowCount} ${currentRowCount === 1 ? "registro" : "registros"
    }${isFiltered ? " filtrados" : ""}.`

  const tableSurfaceContent = (
    <>
      <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        {shouldRenderInitialSkeleton || hasVisibleRows ? (
          <DataTableScrollContainer
            aria-label={resolvedAriaLabel}
            className="w-full max-w-full lg:min-h-0 lg:max-h-full lg:flex-1"
          >
            <Table
              className="min-w-max"
              aria-rowcount={currentRowCount}
              aria-colcount={visibleColumnCount}
            >
              <caption className="sr-only">{caption}</caption>

              <TableHeader
                className={cn(
                  "sticky top-0 z-20",
                  headerSurfaceClassName
                )}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className={headerSurfaceClassName}
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.getSize() }}
                        className={headerSurfaceClassName}
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
                    columnCount={skeletonColumnCount}
                    rowCount={skeletonRowCount}
                    columnSizes={skeletonColumnSizes}
                  />
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
        ) : null}

        {shouldRenderStatePanel ? (
          <DataTableStatePanel kind={stateKind}>
            {stateContent}
          </DataTableStatePanel>
        ) : null}
      </div>

      {shouldRenderPagination ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={normalizedPageSizeOptions}
          rowCount={currentRowCount}
          selectedRowCount={selectedRowCount}
          selectionRowCount={selectionRowCount}
          showSelectedCount={enableRowSelection}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
        />
      ) : null}
    </>
  )

  return (
    <div
      className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:flex-1"
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

      {shouldRenderToolbar ? (
        <Card size="sm">
          <Collapsible defaultOpen className="group/data-table-controls">
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-t-xl px-(--card-spacing) text-left outline-none transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span className="flex min-w-0 items-start gap-2">
                <SlidersHorizontalIcon
                  aria-hidden="true"
                  focusable="false"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />

                <span className="grid min-w-0 gap-1">
                  <span className="text-sm leading-snug font-medium text-foreground">
                    {dataTableCopy.toolbar.controlsTitle}
                  </span>

                  <span className="hidden text-sm text-muted-foreground sm:block">
                    {dataTableCopy.toolbar.controlsDescription}
                  </span>
                </span>
              </span>

              <ChevronDownIcon
                aria-hidden="true"
                focusable="false"
                className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/data-table-controls:rotate-180"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-3">
              <CardContent>
                <DataTableToolbar
                  table={table}
                  globalSearch={normalizedGlobalSearch}
                  globalSearchAriaLabel={
                    normalizedGlobalSearch?.ariaLabel
                  }
                  searchFields={normalizedSearchFields}
                  filterFields={normalizedFilterFields}
                  actions={toolbarActions}
                  enableViewOptions={enableViewOptions}
                  enableExport={enableExport}
                  canExport={
                    (canExport ?? true) && hasVisibleRows
                  }
                  manualFiltering={manualFiltering}
                  isLoading={isLoading}
                  allowExportWhileLoading={allowExportWhileLoading}
                  isExternallyFiltered={isExternallyFiltered}
                  globalFilterValue={globalFilter}
                  onGlobalFilterChange={handleGlobalFilterChange}
                  onClearFilters={handleClearFilters}
                />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ) : null}

      {isLoading && loadingState === undefined ? (
        <span className="sr-only" role="status" aria-live="polite">
          {shouldRenderInitialSkeleton
            ? loadingAnnouncement
            : refetchAnnouncement}
        </span>
      ) : null}

      {surface === "card" ? (
        <Card
          size="sm"
          className="overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-hidden"
        >
          <CardContent className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:flex-1">
            {tableSurfaceContent}
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:flex-1">
          {tableSurfaceContent}
        </div>
      )}
    </div>
  )
}
