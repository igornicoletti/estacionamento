import { type Column } from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"

import { dataTableCopy } from "./data-table-copy"
import { dedupeFilterOptions } from "./data-table-filter-utils"
import {
  type DataTableFilterOption,
  type DataTableFilterOptionGroup,
} from "./data-table-types"

type DataTableFacetCountSource = "column" | "options"

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  options: readonly DataTableFilterOption[]
  groups?: readonly DataTableFilterOptionGroup[]
  placeholder?: string
  showCounts?: boolean
  facetCountSource?: DataTableFacetCountSource
  facetValueToOptionValue?: (value: unknown) => string | null
  maxVisibleChips?: number
}

interface ResolvedFilterOptionLayout {
  groups: readonly DataTableFilterOptionGroup[]
  ungroupedOptions: readonly DataTableFilterOption[]
}

const DEFAULT_MAX_VISIBLE_CHIPS = 3

function normalizeMaxVisibleChips(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_VISIBLE_CHIPS
  }

  return Math.max(1, Math.trunc(value))
}

function normalizeFacetCount(value: unknown): number | undefined {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return undefined
  }

  return Math.trunc(value)
}

function normalizeSelectedFilterValues(
  rawFilterValue: unknown,
  validOptionValues: ReadonlySet<string>
): string[] {
  if (!Array.isArray(rawFilterValue)) {
    return []
  }

  const uniqueValues = new Set<string>()
  const normalizedValues: string[] = []

  for (const value of rawFilterValue) {
    if (
      typeof value !== "string" ||
      !validOptionValues.has(value) ||
      uniqueValues.has(value)
    ) {
      continue
    }

    uniqueValues.add(value)
    normalizedValues.push(value)
  }

  return normalizedValues
}

function resolveSelectedOptions(
  selectedValues: readonly string[],
  optionsByValue: ReadonlyMap<string, DataTableFilterOption>
): DataTableFilterOption[] {
  const selectedOptions: DataTableFilterOption[] = []

  for (const value of selectedValues) {
    const option = optionsByValue.get(value)

    if (option) {
      selectedOptions.push(option)
    }
  }

  return selectedOptions
}

function resolveNextFilterValue(
  value: DataTableFilterOption | DataTableFilterOption[] | null
): string[] | undefined {
  const selectedOptions = Array.isArray(value)
    ? value
    : value
      ? [value]
      : []
  const nextValues = Array.from(
    new Set(selectedOptions.map((option) => option.value))
  )

  return nextValues.length > 0 ? nextValues : undefined
}

function resolveColumnFacetCounts({
  facets,
  validOptionValues,
  facetValueToOptionValue,
}: {
  facets: ReadonlyMap<unknown, number>
  validOptionValues: ReadonlySet<string>
  facetValueToOptionValue?: (value: unknown) => string | null
}): ReadonlyMap<string, number> {
  const counts = new Map<string, number>()

  facets.forEach((rawCount, rawValue) => {
    const optionValue = facetValueToOptionValue
      ? facetValueToOptionValue(rawValue)
      : typeof rawValue === "string"
        ? rawValue
        : null

    if (optionValue === null || !validOptionValues.has(optionValue)) {
      return
    }

    const count = normalizeFacetCount(rawCount)

    if (count === undefined) {
      return
    }

    counts.set(optionValue, (counts.get(optionValue) ?? 0) + count)
  })

  return counts
}

function resolveFilterOptionLayout(
  options: readonly DataTableFilterOption[],
  groups: readonly DataTableFilterOptionGroup[]
): ResolvedFilterOptionLayout {
  const optionsByValue = new Map(
    options.map((option) => [option.value, option])
  )
  const assignedOptionValues = new Set<string>()
  const mergedGroups = new Map<string, DataTableFilterOption[]>()

  for (const group of groups) {
    const groupLabel = group.label.trim()

    if (groupLabel.length === 0) {
      continue
    }

    const resolvedOptions = mergedGroups.get(groupLabel) ?? []

    for (const candidateOption of dedupeFilterOptions(group.options)) {
      const canonicalOption = optionsByValue.get(candidateOption.value)

      if (
        !canonicalOption ||
        assignedOptionValues.has(canonicalOption.value)
      ) {
        continue
      }

      assignedOptionValues.add(canonicalOption.value)
      resolvedOptions.push(canonicalOption)
    }

    mergedGroups.set(groupLabel, resolvedOptions)
  }

  const resolvedGroups = Array.from(mergedGroups, ([label, groupOptions]) => ({
    label,
    options: groupOptions,
  })).filter((group) => group.options.length > 0)
  const ungroupedOptions = options.filter(
    (option) => !assignedOptionValues.has(option.value)
  )

  return {
    groups: resolvedGroups,
    ungroupedOptions,
  }
}

function resolveOptionCount({
  option,
  showCounts,
  facetCountSource,
  columnFacetCounts,
}: {
  option: DataTableFilterOption
  showCounts: boolean
  facetCountSource: DataTableFacetCountSource
  columnFacetCounts?: ReadonlyMap<string, number>
}): number | undefined {
  if (!showCounts) {
    return undefined
  }

  const providedCount = normalizeFacetCount(option.count)

  if (providedCount !== undefined) {
    return providedCount
  }

  if (facetCountSource === "options") {
    return undefined
  }

  return columnFacetCounts?.get(option.value)
}

function DataTableFacetedFilterItem({
  option,
  count,
}: {
  option: DataTableFilterOption
  count?: number
}) {
  return (
    <ComboboxItem value={option}>
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {count !== undefined ? (
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      ) : null}
    </ComboboxItem>
  )
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  groups = [],
  placeholder,
  showCounts = true,
  facetCountSource = "column",
  facetValueToOptionValue,
  maxVisibleChips = DEFAULT_MAX_VISIBLE_CHIPS,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const uniqueOptions = React.useMemo(
    () => dedupeFilterOptions(options),
    [options]
  )
  const optionsByValue = React.useMemo(
    () =>
      new Map(
        uniqueOptions.map((option) => [option.value, option])
      ),
    [uniqueOptions]
  )
  const validOptionValues = React.useMemo(
    () => new Set(optionsByValue.keys()),
    [optionsByValue]
  )
  const rawFilterValue = column.getFilterValue()
  const selectedValues = React.useMemo(
    () =>
      normalizeSelectedFilterValues(
        rawFilterValue,
        validOptionValues
      ),
    [rawFilterValue, validOptionValues]
  )
  const selectedOptions = React.useMemo(
    () => resolveSelectedOptions(selectedValues, optionsByValue),
    [optionsByValue, selectedValues]
  )
  const optionLayout = React.useMemo(
    () => resolveFilterOptionLayout(uniqueOptions, groups),
    [groups, uniqueOptions]
  )
  const normalizedMaxVisibleChips = normalizeMaxVisibleChips(
    maxVisibleChips
  )
  const visibleSelectedOptions = selectedOptions.slice(
    0,
    normalizedMaxVisibleChips
  )
  const hiddenSelectedOptionCount =
    selectedOptions.length - visibleSelectedOptions.length
  const filterLabel =
    placeholder?.trim() ||
    `${dataTableCopy.toolbar.filterPlaceholderPrefix} ${title}`
  const facets =
    showCounts && facetCountSource === "column"
      ? column.getFacetedUniqueValues()
      : undefined
  const columnFacetCounts = React.useMemo(
    () =>
      facets
        ? resolveColumnFacetCounts({
          facets,
          validOptionValues,
          facetValueToOptionValue,
        })
        : undefined,
    [facets, facetValueToOptionValue, validOptionValues]
  )
  const anchorRef = useComboboxAnchor()

  if (uniqueOptions.length === 0) {
    return null
  }

  function renderOption(option: DataTableFilterOption) {
    return (
      <DataTableFacetedFilterItem
        key={option.value}
        option={option}
        count={resolveOptionCount({
          option,
          showCounts,
          facetCountSource,
          columnFacetCounts,
        })}
      />
    )
  }

  return (
    <Combobox
      items={uniqueOptions}
      multiple
      value={selectedOptions}
      onValueChange={(
        value: DataTableFilterOption | DataTableFilterOption[] | null
      ) => {
        column.setFilterValue(resolveNextFilterValue(value))
      }}
      itemToStringValue={(option: DataTableFilterOption) => option.label}
    >
      <ComboboxChips
        ref={anchorRef}
        data-no-drag-scroll="true"
        showTrigger
        className="h-9 min-h-9 w-full min-w-40 flex-nowrap overflow-hidden pr-1 lg:w-44 xl:w-48 2xl:w-56"
      >
        <ComboboxValue>
          {visibleSelectedOptions.map((option) => (
            <ComboboxChip
              key={option.value}
              showRemove={false}
              className="max-w-28 shrink-0"
            >
              <span className="truncate">{option.label}</span>
              <Button
                data-no-drag-scroll="true"
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-mr-1 -ml-0.5 opacity-60 hover:opacity-100"
                aria-label={`Remover ${option.label}`}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.preventDefault()
                  event.stopPropagation()

                  const nextValues = selectedValues.filter(
                    (value) => value !== option.value
                  )

                  column.setFilterValue(
                    nextValues.length > 0 ? nextValues : undefined
                  )
                }}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </ComboboxChip>
          ))}
          {hiddenSelectedOptionCount > 0 ? (
            <>
              <span
                aria-hidden="true"
                className="shrink-0 text-xs font-medium text-muted-foreground"
              >
                +{hiddenSelectedOptionCount}
              </span>
              <span className="sr-only">
                {hiddenSelectedOptionCount} opções adicionais selecionadas
              </span>
            </>
          ) : null}
        </ComboboxValue>
        <ComboboxChipsInput
          aria-label={filterLabel}
          className="min-w-8 flex-1 text-left"
          placeholder={selectedOptions.length > 0 ? "" : filterLabel}
        />
        {selectedOptions.length > 0 ? (
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={dataTableCopy.facetedFilter.clearFilters}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              event.preventDefault()
              event.stopPropagation()
              column.setFilterValue(undefined)
            }}
          >
            <XIcon aria-hidden="true" />
          </Button>
        ) : null}
      </ComboboxChips>
      <ComboboxContent
        anchor={anchorRef}
        data-no-drag-scroll="true"
        className="w-(--anchor-width) min-w-(--anchor-width)"
      >
        <ComboboxEmpty>
          {dataTableCopy.facetedFilter.noResults}
        </ComboboxEmpty>
        <ComboboxList>
          {optionLayout.groups.length > 0 ? (
            <>
              {optionLayout.groups.map((group) => (
                <ComboboxGroup key={group.label} items={group.options}>
                  <ComboboxLabel>{group.label}</ComboboxLabel>
                  <ComboboxCollection>
                    {(option: DataTableFilterOption) =>
                      renderOption(option)
                    }
                  </ComboboxCollection>
                </ComboboxGroup>
              ))}
              {optionLayout.ungroupedOptions.length > 0 ? (
                <ComboboxGroup
                  key="__ungrouped-options"
                  items={optionLayout.ungroupedOptions}
                >
                  <ComboboxCollection>
                    {(option: DataTableFilterOption) =>
                      renderOption(option)
                    }
                  </ComboboxCollection>
                </ComboboxGroup>
              ) : null}
            </>
          ) : (
            <ComboboxCollection>
              {(option: DataTableFilterOption) => renderOption(option)}
            </ComboboxCollection>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
