import * as React from "react"
import { type RowData } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    formatValue?: (value: TValue, row: TData) => React.ReactNode
  }
}

export type DataTableColumnId<TData> = Extract<keyof TData, string>

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilterField<TData> {
  id: DataTableColumnId<TData>
  title: string
  options: readonly DataTableFilterOption[]
  showCounts?: boolean
}

export interface DataTableSearchField<TData> {
  id: DataTableColumnId<TData>
  placeholder?: string
}

export interface DataTableGlobalSearch<TData> {
  columnIds: readonly DataTableColumnId<TData>[]
  placeholder?: string
}
