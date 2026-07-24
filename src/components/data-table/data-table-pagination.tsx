import { type Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  DATA_TABLE_INITIAL_PAGE_SIZE,
  DATA_TABLE_PAGE_SIZE_OPTIONS,
} from "./data-table-constants"
import { dataTableCopy } from "./data-table-copy"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: readonly number[]
  rowCount?: number
  selectedRowCount?: number
  selectionRowCount?: number
  showSelectedCount?: boolean
  showWhenEmpty?: boolean
  canPreviousPage?: boolean
  canNextPage?: boolean
}

function isPositiveSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  )
}

function normalizeNonNegativeInteger(
  value: unknown,
  fallback: number
): number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  )
    ? value
    : fallback
}

function normalizePageSizeOptions(
  pageSizeOptions: readonly number[],
  currentPageSize: number
): number[] {
  const options = new Set<number>()
  for (const pageSize of [...pageSizeOptions, currentPageSize]) {
    if (isPositiveSafeInteger(pageSize)) options.add(pageSize)
  }
  if (!options.size) options.add(DATA_TABLE_INITIAL_PAGE_SIZE)
  return Array.from(options).sort((left, right) => left - right)
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = DATA_TABLE_PAGE_SIZE_OPTIONS,
  rowCount,
  selectedRowCount,
  selectionRowCount,
  showSelectedCount = false,
  showWhenEmpty = false,
  canPreviousPage,
  canNextPage,
}: DataTablePaginationProps<TData>) {
  const pagination = table.getState().pagination
  const pageIndex = normalizeNonNegativeInteger(pagination.pageIndex, 0)
  const displayedRowCount = table.getRowModel().rows.length
  const resolvedRowCount = normalizeNonNegativeInteger(
    rowCount,
    normalizeNonNegativeInteger(table.getRowCount(), displayedRowCount)
  )

  if (!showWhenEmpty && displayedRowCount === 0 && resolvedRowCount === 0) {
    return null
  }

  const rawPageCount = table.getPageCount()
  const pageCountKnown =
    Number.isSafeInteger(rawPageCount) && rawPageCount >= 0
  const pageCount = pageCountKnown ? Math.max(rawPageCount, 1) : null
  const currentPage =
    pageCount === null
      ? pageIndex + 1
      : Math.min(pageIndex + 1, pageCount)
  const pageCountLabel =
    pageCount === null
      ? dataTableCopy.pagination.unknownPageCount
      : String(pageCount)

  const defaultSelectedRowCount =
    table.options.manualPagination === true
      ? table.getSelectedRowModel().rows.length
      : table.getFilteredSelectedRowModel().rows.length
  const resolvedSelectedRowCount = normalizeNonNegativeInteger(
    selectedRowCount,
    defaultSelectedRowCount
  )
  const resolvedSelectionRowCount = Math.max(
    normalizeNonNegativeInteger(
      selectionRowCount,
      table.options.manualPagination === true
        ? displayedRowCount
        : resolvedRowCount
    ),
    resolvedSelectedRowCount
  )

  const resolvedPageSizeOptions = normalizePageSizeOptions(
    pageSizeOptions,
    pagination.pageSize
  )
  const currentPageSize =
    isPositiveSafeInteger(pagination.pageSize) &&
    resolvedPageSizeOptions.includes(pagination.pageSize)
      ? pagination.pageSize
      : resolvedPageSizeOptions[0] ?? DATA_TABLE_INITIAL_PAGE_SIZE

  const canGoToPreviousPage =
    pageIndex > 0 &&
    (canPreviousPage ?? table.getCanPreviousPage())
  const canGoToNextPage =
    (canNextPage ?? table.getCanNextPage()) &&
    (pageCount === null || pageIndex < pageCount - 1)
  const canGoToLastPage = pageCount !== null && canGoToNextPage

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-muted-foreground">
        {showSelectedCount
          ? dataTableCopy.pagination.selectedRows(
              resolvedSelectedRowCount,
              resolvedSelectionRowCount
            )
          : dataTableCopy.pagination.displayedRows(
              displayedRowCount,
              resolvedRowCount
            )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end lg:gap-6">
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-medium md:inline">
            {dataTableCopy.pagination.rowsPerPage}
          </span>
          <Select
            value={String(currentPageSize)}
            onValueChange={(value) => {
              const pageSize = Number(value)
              if (
                !isPositiveSafeInteger(pageSize) ||
                !resolvedPageSizeOptions.includes(pageSize)
              ) {
                return
              }
              table.setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
                pageSize,
              }))
            }}
          >
            <SelectTrigger
              data-no-drag-scroll="true"
              className="h-9 w-20"
              aria-label={dataTableCopy.pagination.rowsPerPage}
            >
              <SelectValue placeholder={String(currentPageSize)} />
            </SelectTrigger>
            <SelectContent
              data-no-drag-scroll="true"
              side="top"
              position="popper"
            >
              {resolvedPageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-20 items-center justify-center text-sm font-medium">
          {dataTableCopy.pagination.pageOf(currentPage, pageCountLabel)}
        </div>

        <div className="flex items-center gap-1">
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            className="hidden lg:flex"
            onClick={() => table.firstPage()}
            disabled={!canGoToPreviousPage}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.firstPage}
            </span>
            <ChevronsLeft aria-hidden="true" focusable="false" />
          </Button>
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => table.previousPage()}
            disabled={!canGoToPreviousPage}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.previousPage}
            </span>
            <ChevronLeft aria-hidden="true" focusable="false" />
          </Button>
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => table.nextPage()}
            disabled={!canGoToNextPage}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.nextPage}
            </span>
            <ChevronRight aria-hidden="true" focusable="false" />
          </Button>
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            className="hidden lg:flex"
            onClick={() => table.lastPage()}
            disabled={!canGoToLastPage}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.lastPage}
            </span>
            <ChevronsRight aria-hidden="true" focusable="false" />
          </Button>
        </div>
      </div>
    </div>
  )
}
