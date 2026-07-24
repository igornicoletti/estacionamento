import {
  type FilterFn,
  type Row,
  type RowData,
} from "@tanstack/react-table"

import {
  DATA_TABLE_EMPTY_FILTER_VALUE,
  normalizeDataTableFilterValue,
} from "./data-table-filter-options"

function normalizeSelectedFilterValues(value: unknown): string[] {
  const candidates = Array.isArray(value)
    ? value
    : value === null || value === undefined
      ? []
      : [value]
  const normalized = new Set<string>()

  for (const candidate of candidates) {
    const result = normalizeDataTableFilterValue(candidate)
    if (result !== null) normalized.add(result)
  }

  return Array.from(normalized)
}

function normalizeRowFilterValues(value: unknown): string[] {
  const candidates = Array.isArray(value)
    ? value.length > 0
      ? value
      : [null]
    : [value]
  const normalized = new Set<string>()

  for (const candidate of candidates) {
    const result = normalizeDataTableFilterValue(
      candidate,
      DATA_TABLE_EMPTY_FILTER_VALUE
    )
    if (result !== null) normalized.add(result)
  }

  return Array.from(normalized)
}

function includesSelectedValueFilter<TData extends RowData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown
): boolean {
  const selectedValues = normalizeSelectedFilterValues(filterValue)
  if (selectedValues.length === 0) return true

  const rowValues = normalizeRowFilterValues(row.getValue(columnId))
  if (rowValues.length === 0) return false

  const selectedSet = new Set(selectedValues)
  return rowValues.some((rowValue) => selectedSet.has(rowValue))
}

export const includesSelectedValue = Object.assign(
  includesSelectedValueFilter,
  {
    resolveFilterValue: (value: unknown): string[] =>
      normalizeSelectedFilterValues(value),
    autoRemove: (value: unknown): boolean =>
      normalizeSelectedFilterValues(value).length === 0,
  }
) satisfies FilterFn<RowData>
