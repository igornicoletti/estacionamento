import { type Row } from "@tanstack/react-table"

function normalizeSelectedFilterValues(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return []
  }

  return value.map((item) => String(item))
}

function normalizeRowFilterValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item))
  }

  if (value === null || value === undefined || value === "") {
    return []
  }

  return [String(value)]
}

export function includesSelectedValue<TData>(
  row: Row<TData>,
  columnId: string,
  value: unknown
) {
  const selectedValues = normalizeSelectedFilterValues(value)

  if (!selectedValues.length) {
    return true
  }

  const rowValues = normalizeRowFilterValues(row.getValue(columnId))

  return selectedValues.some((selectedValue) => rowValues.includes(selectedValue))
}
