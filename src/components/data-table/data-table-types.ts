import * as React from "react"
import { type RowData } from "@tanstack/react-table"

import { type XlsxCellValue } from "@/lib/export"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    formatValue?: (value: TValue, row: TData) => React.ReactNode
    enableExport?: boolean
    exportValue?: (value: TValue, row: TData) => XlsxCellValue
  }
}

export type DataTableColumnId<TData> = Extract<keyof TData, string> | (string & {})

export interface DataTableFilterOption {
  count?: number
  label: string
  value: string
}

export interface DataTableFilterOptionGroup {
  label: string
  options: readonly DataTableFilterOption[]
}

export interface DataTableFilterField<TData> {
  id: DataTableColumnId<TData>
  title: string
  options: readonly DataTableFilterOption[]
  groups?: readonly DataTableFilterOptionGroup[]
  showCounts?: boolean
  maxVisibleChips?: number
}

export interface DataTableSearchField<TData> {
  id: DataTableColumnId<TData>
  placeholder?: string
}

export interface DataTableGlobalSearch<TData> {
  columnIds: readonly DataTableColumnId<TData>[]
  placeholder?: string
}

export interface DataTableStateAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
}
