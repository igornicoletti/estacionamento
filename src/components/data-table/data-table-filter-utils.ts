import {
  type DataTableColumnId,
  type DataTableFilterField,
  type DataTableFilterOption,
  type DataTableGlobalSearch,
  type DataTableSearchField,
} from "./data-table-types"

export function normalizeSearchValue(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export function normalizeFilterText(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : typeof value === "number" ||
            typeof value === "boolean" ||
            typeof value === "bigint"
          ? String(value)
          : value instanceof Date
            ? value.toISOString()
            : ""

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

export function isEmptyFilterValue(value: unknown) {
  if (value === undefined || value === null) {
    return true
  }

  if (typeof value === "string") {
    return normalizeSearchValue(value).length === 0
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  return false
}

export function dedupeStrings(values: readonly string[]) {
  return Array.from(new Set(values))
}

export function dedupeGlobalSearchColumnIds<TData>(
  globalSearch: DataTableGlobalSearch<TData> | undefined
) {
  return dedupeStrings(
    globalSearch?.columnIds ?? []
  ) as DataTableColumnId<TData>[]
}

export function dedupeSearchFields<TData>(
  fields: readonly DataTableSearchField<TData>[] = []
) {
  const seen = new Set<DataTableColumnId<TData>>()

  return fields.filter((field) => {
    if (seen.has(field.id)) {
      return false
    }

    seen.add(field.id)
    return true
  })
}

export function dedupeFilterFields<TData>(
  fields: readonly DataTableFilterField<TData>[] = []
) {
  const seen = new Set<DataTableColumnId<TData>>()

  return fields.filter((field) => {
    if (seen.has(field.id)) {
      return false
    }

    seen.add(field.id)
    return true
  })
}

export function dedupeFilterOptions(
  options: readonly DataTableFilterOption[]
) {
  const seen = new Set<string>()

  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false
    }

    seen.add(option.value)
    return true
  })
}
