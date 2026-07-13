import { type Row } from "@tanstack/react-table"

function stringifyFilterValue(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return ""
}

function normalizeSelectedFilterValues(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return []
  }

  return value.map(stringifyFilterValue).filter(Boolean)
}

function normalizeRowFilterValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(stringifyFilterValue).filter(Boolean)
  }

  if (value === null || value === undefined || value === "") {
    return []
  }

  return [stringifyFilterValue(value)].filter(Boolean)
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
