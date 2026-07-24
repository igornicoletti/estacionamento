import { type DataTableFilterOption } from "./data-table-types"

export const DATA_TABLE_EMPTY_FILTER_VALUE = "__data_table_empty__" as const

type DataTableEmptyFilterValue = typeof DATA_TABLE_EMPTY_FILTER_VALUE

type DataTableFilterOptionValue =
  | string
  | number
  | boolean
  | bigint
  | Date
  | null
  | undefined

type DataTableEmptyFilterOption = Omit<
  DataTableFilterOption,
  "value" | "count"
> & {
  value?: "" | DataTableEmptyFilterValue
}

interface CreateDataTableFilterOptionsConfig<TData, TValue> {
  emptyOption?: DataTableEmptyFilterOption
  normalizeValue?: (value: TValue, row: TData) => string | null
  normalizeLabel?: (label: string, row: TData) => string | null
  sortOptions?: (
    left: DataTableFilterOption,
    right: DataTableFilterOption
  ) => number
}

interface FilterOptionAccumulator {
  count: number
  firstSeenIndex: number
  labels: Map<string, number>
}

const filterLabelCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "variant",
})

function isEmptySourceValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0)
  )
}

function normalizeStringValue(value: string): string | null {
  const normalized = value.trim().normalize("NFC")
  return normalized.length > 0 ? normalized : null
}

export function normalizeDataTableFilterValue(
  value: unknown,
  emptyValue: string | null = null
): string | null {
  if (isEmptySourceValue(value)) return emptyValue
  if (typeof value === "string") return normalizeStringValue(value)
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null
  if (typeof value === "boolean" || typeof value === "bigint") return String(value)
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : null
  }
  return null
}

function normalizeFilterOptionLabel(label: string): string | null {
  const normalized = label.trim().replace(/\s+/gu, " ").normalize("NFC")
  return normalized.length > 0 ? normalized : null
}

function resolveEmptyOption(
  emptyOption: DataTableEmptyFilterOption | undefined
): DataTableFilterOption | undefined {
  if (!emptyOption) return undefined

  const label = normalizeFilterOptionLabel(emptyOption.label)
  if (!label) {
    throw new TypeError(
      "createDataTableFilterOptions: emptyOption.label deve conter texto visível."
    )
  }

  return { label, value: DATA_TABLE_EMPTY_FILTER_VALUE }
}

function resolveMostFrequentLabel(
  labels: ReadonlyMap<string, number>,
  fallback: string
): string {
  let resolvedLabel = fallback
  let resolvedCount = -1

  for (const [label, count] of labels) {
    if (
      count > resolvedCount ||
      (count === resolvedCount &&
        filterLabelCollator.compare(label, resolvedLabel) < 0)
    ) {
      resolvedLabel = label
      resolvedCount = count
    }
  }

  return resolvedLabel
}

function incrementLabelCount(labels: Map<string, number>, label: string) {
  labels.set(label, (labels.get(label) ?? 0) + 1)
}

export function createDataTableFilterOptions<
  TData,
  TValue = DataTableFilterOptionValue,
>(
  data: readonly TData[] | undefined,
  getValue: (row: TData) => TValue,
  getLabel: (row: TData) => string,
  {
    emptyOption,
    normalizeValue,
    normalizeLabel,
    sortOptions,
  }: CreateDataTableFilterOptionsConfig<TData, TValue> = {}
): DataTableFilterOption[] {
  if (!data?.length) return []

  const resolvedEmptyOption = resolveEmptyOption(emptyOption)
  const accumulators = new Map<string, FilterOptionAccumulator>()
  let nextFirstSeenIndex = 0

  for (const row of data) {
    const rawValue = getValue(row)
    const isEmptyValue = isEmptySourceValue(rawValue)

    let value: string | null
    if (isEmptyValue) {
      value = resolvedEmptyOption?.value ?? null
    } else {
      value = normalizeValue
        ? normalizeValue(rawValue, row)
        : normalizeDataTableFilterValue(rawValue)
      value = typeof value === "string" ? normalizeStringValue(value) : null
    }

    if (value === null) continue

    if (!isEmptyValue && value === DATA_TABLE_EMPTY_FILTER_VALUE) {
      throw new Error(
        `createDataTableFilterOptions: o valor real "${DATA_TABLE_EMPTY_FILTER_VALUE}" colide com o sentinela reservado para valores vazios.`
      )
    }

    let accumulator = accumulators.get(value)
    if (!accumulator) {
      accumulator = {
        count: 0,
        firstSeenIndex: nextFirstSeenIndex,
        labels: new Map<string, number>(),
      }
      nextFirstSeenIndex += 1
      accumulators.set(value, accumulator)
    }

    accumulator.count += 1

    if (value === DATA_TABLE_EMPTY_FILTER_VALUE) {
      if (resolvedEmptyOption) {
        incrementLabelCount(accumulator.labels, resolvedEmptyOption.label)
      }
      continue
    }

    const rawLabel = getLabel(row)
    const customLabel = normalizeLabel ? normalizeLabel(rawLabel, row) : rawLabel
    const label =
      customLabel === null
        ? value
        : normalizeFilterOptionLabel(customLabel) ?? value

    incrementLabelCount(accumulator.labels, label)
  }

  const options = Array.from(accumulators.entries())
    .sort(([, left], [, right]) => left.firstSeenIndex - right.firstSeenIndex)
    .map(([value, accumulator]) => ({
      value,
      label: resolveMostFrequentLabel(accumulator.labels, value),
      count: accumulator.count,
    }))

  return sortOptions ? [...options].sort(sortOptions) : options
}
