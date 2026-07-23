import {
  type FilterFn,
  type Row,
  type RowData,
} from "@tanstack/react-table"

import {
  DATA_TABLE_EMPTY_FILTER_VALUE,
  normalizeDataTableFilterValue,
} from "./data-table-filter-options"

function normalizeSelectedFilterValues(
  value: unknown
): string[] {
  const candidateValues = Array.isArray(value)
    ? value
    : value === null || value === undefined
      ? []
      : [value]

  const normalizedValues = new Set<string>()

  for (const candidateValue of candidateValues) {
    const normalizedValue =
      normalizeDataTableFilterValue(
        candidateValue
      )

    if (normalizedValue !== null) {
      normalizedValues.add(normalizedValue)
    }
  }

  return Array.from(normalizedValues)
}

function normalizeRowFilterValues(
  value: unknown
): string[] {
  const candidateValues = Array.isArray(value)
    ? value.length > 0
      ? value
      : [null]
    : [value]

  const normalizedValues = new Set<string>()

  for (const candidateValue of candidateValues) {
    const normalizedValue =
      normalizeDataTableFilterValue(
        candidateValue,
        DATA_TABLE_EMPTY_FILTER_VALUE
      )

    if (normalizedValue !== null) {
      normalizedValues.add(normalizedValue)
    }
  }

  return Array.from(normalizedValues)
}

function includesSelectedValueFilter<
  TData extends RowData,
>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown
): boolean {
  const selectedValues =
    normalizeSelectedFilterValues(filterValue)

  if (selectedValues.length === 0) {
    return true
  }

  const rowValues =
    normalizeRowFilterValues(
      row.getValue(columnId)
    )

  if (rowValues.length === 0) {
    return false
  }

  const selectedValueSet =
    new Set(selectedValues)

  return rowValues.some((rowValue) =>
    selectedValueSet.has(rowValue)
  )
}

export const includesSelectedValue =
  Object.assign(
    includesSelectedValueFilter,
    {
      resolveFilterValue: (
        value: unknown
      ): string[] =>
        normalizeSelectedFilterValues(value),

      autoRemove: (value: unknown): boolean =>
        normalizeSelectedFilterValues(
          value
        ).length === 0,
    }
  ) satisfies FilterFn<RowData>
