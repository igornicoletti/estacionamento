import { type Row } from "@tanstack/react-table"

export function includesSelectedValue<TData>(
  row: Row<TData>,
  columnId: string,
  value: unknown
) {
  if (!Array.isArray(value) || value.length === 0) {
    return true
  }

  const selectedValues = value.map((item) => String(item))
  const rowValue = String(row.getValue(columnId) ?? "")

  return selectedValues.includes(rowValue)
}
