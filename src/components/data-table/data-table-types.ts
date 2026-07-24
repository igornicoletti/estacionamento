import type { RowData } from '@tanstack/react-table'
import type { ReactNode } from "react"

export type DataTableExportCellValue =
  | string
  | number
  | boolean
  | null
  | undefined

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    enableExport?: boolean
    exportValue?: (
      value: TValue,
      row: TData
    ) => DataTableExportCellValue
  }
}

declare const dataTableCustomColumnIdBrand: unique symbol

export type DataTableAccessorKey<TData> = Extract<keyof TData, string>

export type DataTableCustomColumnId<TId extends string = string> = TId & {
  readonly [dataTableCustomColumnIdBrand]: "DataTableCustomColumnId"
}

export type DataTableColumnId<TData> =
  | DataTableAccessorKey<TData>
  | DataTableCustomColumnId

export function defineDataTableCustomColumnId<const TId extends string>(
  id: TId
): DataTableCustomColumnId<TId> {
  if (id.length === 0 || id.trim() !== id) {
    throw new TypeError(
      "defineDataTableCustomColumnId: o ID deve ser uma string não vazia e sem espaços nas extremidades."
    )
  }

  return id as DataTableCustomColumnId<TId>
}

export type DataTableFilterOptionValue = string

export interface DataTableFilterOption {
  count?: number
  label: string
  value: DataTableFilterOptionValue
}

export interface DataTableFilterOptionGroup {
  id?: string
  label: string
  options: readonly DataTableFilterOption[]
}

export type DataTableFacetCountSource = "column" | "options"

export interface DataTableFilterField<TData> {
  id: DataTableColumnId<TData>
  title: string
  options: readonly DataTableFilterOption[]
  groups?: readonly DataTableFilterOptionGroup[]
  showCounts?: boolean
  countSource?: DataTableFacetCountSource
  facetValueToOptionValue?: (value: unknown) => string | null
  maxVisibleChips?: number
}

export interface DataTableSearchField<TData> {
  id: DataTableColumnId<TData>
  label?: string
  ariaLabel?: string
  placeholder?: string
}

export interface DataTableGlobalSearch<TData> {
  columnIds: readonly DataTableColumnId<TData>[]
  label?: string
  ariaLabel?: string
  placeholder?: string
}

export interface DataTableStateAction {
  label: string
  icon?: ReactNode
  onClick: () => void
}
