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

import { dataTableCopy } from "./data-table-copy"

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: readonly number[]
  rowCount: number
  selectedRowCount?: number
  showSelectedCount?: boolean
}

function normalizePageSizeOptions(
  pageSizeOptions: readonly number[],
  currentPageSize: number
) {
  const options = new Set(
    [...pageSizeOptions, currentPageSize].filter(
      (pageSize) => Number.isInteger(pageSize) && pageSize > 0
    )
  )

  return Array.from(options).sort((a, b) => a - b)
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  rowCount,
  selectedRowCount = 0,
  showSelectedCount = true,
}: DataTablePaginationProps<TData>) {
  const rawPageCount = table.getPageCount()
  const isPageCountKnown = Number.isFinite(rawPageCount) && rawPageCount >= 0
  const pageCount = isPageCountKnown ? rawPageCount : 0
  const pagination = table.getState().pagination
  const currentPage =
    pageCount > 0 || !isPageCountKnown ? pagination.pageIndex + 1 : 0
  const pageCountLabel = isPageCountKnown
    ? String(pageCount)
    : dataTableCopy.pagination.unknownPageCount
  const displayedRowCount = table.getRowModel().rows.length
  const selectedRowsText = dataTableCopy.pagination.selectedRows(
    selectedRowCount,
    rowCount
  )
  const displayedRowsText = dataTableCopy.pagination.displayedRows(
    displayedRowCount,
    rowCount
  )
  const pageOfText = dataTableCopy.pagination.pageOf(
    currentPage,
    pageCountLabel
  )
  const resolvedPageSizeOptions = normalizePageSizeOptions(
    pageSizeOptions,
    pagination.pageSize
  )

  return (
    <div className="flex flex-col gap-3 px-2 md:flex-row md:items-center md:justify-between">
      <div className="text-center text-sm text-muted-foreground md:flex-1 md:text-left">
        {showSelectedCount ? selectedRowsText : displayedRowsText}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end lg:gap-6">
        <div className="flex items-center gap-2">
          <p className="hidden text-sm font-medium md:block">
            {dataTableCopy.pagination.rowsPerPage}
          </p>
          <Select
            value={`${pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPagination((previous) => ({
                ...previous,
                pageIndex: 0,
                pageSize: Number(value),
              }))
            }}
          >
            <SelectTrigger className="w-20 data-[size=default]:h-9">
              <SelectValue placeholder={`${pagination.pageSize}`} />
            </SelectTrigger>
            <SelectContent side="top" position="popper">
              {resolvedPageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-20 items-center justify-center text-sm font-medium">
          {pageOfText}
        </div>

        <div className="flex items-center gap-1">
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            className="hidden lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.firstPage}
            </span>
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.previousPage}
            </span>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.nextPage}
            </span>
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="outline"
            size="icon-lg"
            className="hidden lg:flex"
            onClick={() => {
              if (isPageCountKnown) {
                table.setPageIndex(Math.max(pageCount - 1, 0))
              }
            }}
            disabled={!isPageCountKnown || !table.getCanNextPage()}
          >
            <span className="sr-only">
              {dataTableCopy.pagination.lastPage}
            </span>
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
