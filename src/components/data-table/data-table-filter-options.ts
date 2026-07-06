import { type DataTableFilterOption } from "./data-table-types"

export function createDataTableFilterOptions<
  TData,
  TValue extends string | number,
>(
  data: readonly TData[],
  getValue: (row: TData) => TValue,
  getLabel: (row: TData) => string
): DataTableFilterOption[] {
  const options = new Map<string, DataTableFilterOption>()

  data.forEach((row) => {
    const value = String(getValue(row))

    if (!value || options.has(value)) {
      return
    }

    options.set(value, {
      label: getLabel(row),
      value,
    })
  })

  return Array.from(options.values())
}