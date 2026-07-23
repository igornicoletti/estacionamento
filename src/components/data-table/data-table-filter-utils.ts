import {
  type DataTableColumnId,
  type DataTableFilterField,
  type DataTableFilterOption,
  type DataTableGlobalSearch,
  type DataTableSearchField,
} from "./data-table-types"

const SEARCH_WHITESPACE_PATTERN = /\s+/gu
const COMBINING_MARKS_PATTERN = /\p{M}+/gu

function normalizeWhitespace(value: string): string {
  return value
    .trim()
    .replace(SEARCH_WHITESPACE_PATTERN, " ")
}

function stringifySearchValue(value: unknown): string {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? String(value)
      : ""
  }

  if (
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value)
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime())
      ? value.toISOString()
      : ""
  }

  if (Array.isArray(value)) {
    return value
      .map(stringifySearchValue)
      .filter((item) => item.length > 0)
      .join(" ")
  }

  return ""
}

function dedupeValues<TValue>(
  values: readonly TValue[]
): TValue[] {
  return Array.from(new Set(values))
}

function dedupeByKey<TValue, TKey>(
  values: readonly TValue[],
  getKey: (value: TValue) => TKey
): TValue[] {
  const seenKeys = new Set<TKey>()
  const uniqueValues: TValue[] = []

  for (const value of values) {
    const key = getKey(value)

    if (seenKeys.has(key)) {
      continue
    }

    seenKeys.add(key)
    uniqueValues.push(value)
  }

  return uniqueValues
}

export function normalizeSearchValue(
  value: string
): string {
  return normalizeWhitespace(
    value.normalize("NFC")
  )
}

export function normalizeFilterText(
  value: unknown
): string {
  const searchableValue =
    stringifySearchValue(value)

  if (searchableValue.length === 0) {
    return ""
  }

  return normalizeWhitespace(searchableValue)
    .normalize("NFD")
    .replace(COMBINING_MARKS_PATTERN, "")
    .toLocaleLowerCase("pt-BR")
}

export function isEmptyFilterValue(
  value: unknown
): boolean {
  if (
    value === undefined ||
    value === null
  ) {
    return true
  }

  if (typeof value === "string") {
    return normalizeSearchValue(value).length === 0
  }

  if (typeof value === "number") {
    return !Number.isFinite(value)
  }

  if (value instanceof Date) {
    return !Number.isFinite(value.getTime())
  }

  if (Array.isArray(value)) {
    return (
      value.length === 0 ||
      value.every(isEmptyFilterValue)
    )
  }

  return false
}

export function dedupeStrings(
  values: readonly string[]
): string[] {
  return dedupeValues(values)
}

export function dedupeGlobalSearchColumnIds<TData>(
  globalSearch:
    | DataTableGlobalSearch<TData>
    | undefined
): DataTableColumnId<TData>[] {
  return dedupeValues(
    globalSearch?.columnIds ?? []
  )
}

export function dedupeSearchFields<TData>(
  fields: readonly DataTableSearchField<TData>[] = []
): DataTableSearchField<TData>[] {
  return dedupeByKey(
    fields,
    (field) => field.id
  )
}

export function dedupeFilterFields<TData>(
  fields: readonly DataTableFilterField<TData>[] = []
): DataTableFilterField<TData>[] {
  return dedupeByKey(
    fields,
    (field) => field.id
  )
}

export function dedupeFilterOptions(
  options: readonly DataTableFilterOption[]
): DataTableFilterOption[] {
  return dedupeByKey(
    options,
    (option) => option.value
  )
}
