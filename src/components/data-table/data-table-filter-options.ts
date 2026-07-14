import { type DataTableFilterOption } from "./data-table-types"

interface CreateDataTableFilterOptionsConfig {
  emptyOption?: DataTableFilterOption
}

export function createDataTableFilterOptions<
  TData,
  TValue extends string | number | null | undefined,
>(
  data: readonly TData[],
  getValue: (row: TData) => TValue,
  getLabel: (row: TData) => string,
  config: CreateDataTableFilterOptionsConfig = {}
): DataTableFilterOption[] {
  const options = new Map<string, DataTableFilterOption>()
  const counts = new Map<string, number>()

  data.forEach((row) => {
    const rawValue = getValue(row)
    const value = rawValue === null || rawValue === undefined
      ? ""
      : String(rawValue)
    const normalizedValue = value || config.emptyOption?.value

    if (normalizedValue !== undefined) {
      counts.set(normalizedValue, (counts.get(normalizedValue) ?? 0) + 1)
    }

    if (!value && config.emptyOption) {
      if (!options.has(config.emptyOption.value)) {
        options.set(config.emptyOption.value, config.emptyOption)
      }

      return
    }

    if (!value || options.has(value)) {
      return
    }

    options.set(value, {
      label: getLabel(row),
      value,
    })
  })

  return Array.from(options.values()).map((option) => ({
    ...option,
    count: counts.get(option.value) ?? option.count,
  }))
}
