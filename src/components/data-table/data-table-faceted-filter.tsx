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
  type DataTableFacetCountSource,
  type DataTableFilterOption,
  type DataTableFilterOptionGroup,
} from "./data-table-types"

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

interface ResolvedFilterOptionGroup {
  key: string
  label: string
  options: readonly DataTableFilterOption[]
}

interface ResolvedFilterOptionLayout {
  groups: readonly ResolvedFilterOptionGroup[]
  ungroupedOptions: readonly DataTableFilterOption[]
}

const DEFAULT_MAX_VISIBLE_CHIPS = 3

function normalizeMaxVisibleChips(value: number): number {
  return Number.isFinite(value)
    ? Math.max(1, Math.trunc(value))
    : DEFAULT_MAX_VISIBLE_CHIPS
}

function normalizeFacetCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : undefined
}

function normalizeSelectedFilterValues(
  rawValue: unknown,
  validValues: ReadonlySet<string>
): string[] {
  if (!Array.isArray(rawValue)) return []

  const unique = new Set<string>()
  for (const value of rawValue) {
    if (typeof value === "string" && validValues.has(value)) {
      unique.add(value)
    }
  }
  return Array.from(unique)
}

function resolveNextFilterValue(
  value: DataTableFilterOption | DataTableFilterOption[] | null
): string[] | undefined {
  const options = Array.isArray(value) ? value : value ? [value] : []
  const values = Array.from(new Set(options.map((option) => option.value)))
  return values.length ? values : undefined
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
    const count = normalizeFacetCount(rawCount)

    if (
      optionValue === null ||
      !validOptionValues.has(optionValue) ||
      count === undefined
    ) {
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
  const optionsByValue = new Map(options.map((option) => [option.value, option]))
  const assignedValues = new Set<string>()
  const resolvedGroups: ResolvedFilterOptionGroup[] = []
  const seenGroupKeys = new Set<string>()

  for (const group of groups) {
    const label = group.label.trim().replace(/\s+/gu, " ")
    const explicitId = group.id?.trim() ?? ""
    const key = explicitId || label
    if (!label || !key || seenGroupKeys.has(key)) continue

    const groupOptions: DataTableFilterOption[] = []
    for (const candidate of dedupeFilterOptions(group.options)) {
      const canonical = optionsByValue.get(candidate.value)
      if (!canonical || assignedValues.has(canonical.value)) continue
      assignedValues.add(canonical.value)
      groupOptions.push(canonical)
    }

    if (groupOptions.length) {
      seenGroupKeys.add(key)
      resolvedGroups.push({ key, label, options: groupOptions })
    }
  }

  return {
    groups: resolvedGroups,
    ungroupedOptions: options.filter(
      (option) => !assignedValues.has(option.value)
    ),
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
  if (!showCounts) return undefined
  return facetCountSource === "options"
    ? normalizeFacetCount(option.count)
    : columnFacetCounts?.get(option.value)
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
    () => new Map(uniqueOptions.map((option) => [option.value, option])),
    [uniqueOptions]
  )
  const validOptionValues = React.useMemo(
    () => new Set(optionsByValue.keys()),
    [optionsByValue]
  )
  const selectedValues = React.useMemo(
    () =>
      normalizeSelectedFilterValues(
        column.getFilterValue(),
        validOptionValues
      ),
    [column, validOptionValues]
  )
  const selectedOptions = React.useMemo(
    () =>
      selectedValues.flatMap((value) => {
        const option = optionsByValue.get(value)
        return option ? [option] : []
      }),
    [optionsByValue, selectedValues]
  )
  const optionLayout = React.useMemo(
    () => resolveFilterOptionLayout(uniqueOptions, groups),
    [groups, uniqueOptions]
  )
  const visibleSelectedOptions = selectedOptions.slice(
    0,
    normalizeMaxVisibleChips(maxVisibleChips)
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

  if (!uniqueOptions.length) return null

  const renderOption = (option: DataTableFilterOption) => (
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

  return (
    <Combobox
      items={uniqueOptions}
      multiple
      value={selectedOptions}
      onValueChange={(
        value: DataTableFilterOption | DataTableFilterOption[] | null
      ) => column.setFilterValue(resolveNextFilterValue(value))}
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
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const nextValues = selectedValues.filter(
                    (value) => value !== option.value
                  )
                  column.setFilterValue(
                    nextValues.length ? nextValues : undefined
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
          placeholder={selectedOptions.length ? "" : filterLabel}
        />
        {selectedOptions.length ? (
          <Button
            data-no-drag-scroll="true"
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={dataTableCopy.facetedFilter.clearFilters}
            onClick={(event) => {
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
        <ComboboxEmpty>{dataTableCopy.facetedFilter.noResults}</ComboboxEmpty>
        <ComboboxList>
          {optionLayout.groups.length ? (
            <>
              {optionLayout.groups.map((group) => (
                <ComboboxGroup key={group.key} items={group.options}>
                  <ComboboxLabel>{group.label}</ComboboxLabel>
                  <ComboboxCollection>
                    {(option: DataTableFilterOption) => renderOption(option)}
                  </ComboboxCollection>
                </ComboboxGroup>
              ))}
              {optionLayout.ungroupedOptions.length ? (
                <ComboboxGroup items={optionLayout.ungroupedOptions}>
                  <ComboboxCollection>
                    {(option: DataTableFilterOption) => renderOption(option)}
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
