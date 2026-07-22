import { type Column } from "@tanstack/react-table"
import * as React from "react"

import {
  Combobox,
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

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  options: readonly DataTableFilterOption[]
  groups?: readonly DataTableFilterOptionGroup[]
  showCounts?: boolean
  maxVisibleChips?: number
}

const DEFAULT_MAX_VISIBLE_CHIPS = 3

function resolveSelectedOptions(
  options: readonly DataTableFilterOption[],
  selectedValues: ReadonlySet<string>
) {
  return options.filter((option) => selectedValues.has(option.value))
}

function resolveNextFilterValue(
  value: DataTableFilterOption | DataTableFilterOption[] | null
) {
  if (!Array.isArray(value)) {
    return undefined
  }

  const nextValues = value.map((option) => option.value)

  return nextValues.length ? nextValues : undefined
}

function DataTableFacetedFilterItem({
  facetCounts,
  option,
  showCounts,
}: {
  facetCounts?: ReadonlyMap<string, number>
  option: DataTableFilterOption
  showCounts: boolean
}) {
  const count = option.count ?? facetCounts?.get(option.value)

  return (
    <ComboboxItem key={option.value} value={option}>
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {showCounts && count !== undefined ? (
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
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
  showCounts = true,
  maxVisibleChips = DEFAULT_MAX_VISIBLE_CHIPS,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const uniqueOptions = React.useMemo(
    () => dedupeFilterOptions(options),
    [options]
  )
  const validOptionValues = React.useMemo(
    () => new Set(uniqueOptions.map((option) => option.value)),
    [uniqueOptions]
  )
  const facets = showCounts ? column.getFacetedUniqueValues() : undefined
  const facetCounts = React.useMemo(() => {
    if (!facets) {
      return undefined
    }

    const counts = new Map<string, number>()

    facets.forEach((count, value) => {
      counts.set(String(value), count)
    })

    return counts
  }, [facets])
  const rawFilterValue = column.getFilterValue()
  const selectedValues = React.useMemo(
    () =>
      new Set(
        Array.isArray(rawFilterValue)
          ? rawFilterValue
            .map(String)
            .filter((value) => validOptionValues.has(value))
          : []
      ),
    [rawFilterValue, validOptionValues]
  )
  const selectedOptions = React.useMemo(
    () => resolveSelectedOptions(uniqueOptions, selectedValues),
    [selectedValues, uniqueOptions]
  )
  const selectedSummary = React.useMemo(() => {
    if (selectedOptions.length === 0) {
      return ""
    }

    const visibleLabels = selectedOptions
      .slice(0, maxVisibleChips)
      .map((option) => option.label)
      .join(", ")
    const hiddenCount = selectedOptions.length - Math.min(selectedOptions.length, maxVisibleChips)

    return hiddenCount > 0
      ? `${visibleLabels} +${hiddenCount}`
      : visibleLabels
  }, [maxVisibleChips, selectedOptions])
  const anchorRef = useComboboxAnchor()
  const uniqueGroups = React.useMemo(() => {
    if (!groups.length) {
      return []
    }

    return groups
      .map((group) => ({
        ...group,
        options: dedupeFilterOptions(group.options).filter((option) =>
          validOptionValues.has(option.value)
        ),
      }))
      .filter((group) => group.options.length > 0)
  }, [groups, validOptionValues])
  const hasGroups = uniqueGroups.length > 0

  if (!uniqueOptions.length) {
    return null
  }

  return (
    <Combobox
      items={uniqueOptions}
      multiple
      value={selectedOptions}
      onValueChange={(value) => {
        column.setFilterValue(resolveNextFilterValue(value))
      }}
      itemToStringValue={(option: DataTableFilterOption) => option.label}
    >
      <ComboboxChips
        ref={anchorRef}
        data-no-drag-scroll="true"
        aria-label={title}
        showClear={selectedOptions.length > 0}
        showTrigger
        className="relative h-9 min-h-9 w-full min-w-40 flex-nowrap overflow-hidden pr-1 lg:w-44 xl:w-48 2xl:w-56"
      >
        {selectedOptions.length > 0 ? (
          <ComboboxValue>
            <span className="pointer-events-none absolute top-1/2 right-14 left-2.5 -translate-y-1/2 truncate text-left whitespace-nowrap text-sm">
              {selectedSummary}
            </span>
          </ComboboxValue>
        ) : null}
        <ComboboxChipsInput
          aria-label={title}
          className="min-w-0 flex-1 truncate text-left whitespace-nowrap"
          style={selectedOptions.length > 0 ? { color: "transparent", caretColor: "currentColor" } : undefined}
          placeholder={selectedOptions.length > 0 ? "" : title}
        />
      </ComboboxChips>
      <ComboboxContent
        anchor={anchorRef}
        data-no-drag-scroll="true"
        className="w-(--anchor-width) min-w-(--anchor-width)"
      >
        <ComboboxEmpty>{dataTableCopy.facetedFilter.noResults}</ComboboxEmpty>
        <ComboboxList>
          {hasGroups ? (
            uniqueGroups.map((group) => (
              <ComboboxGroup key={group.label} items={group.options}>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(option: DataTableFilterOption) => (
                    <DataTableFacetedFilterItem
                      key={option.value}
                      facetCounts={facetCounts}
                      option={option}
                      showCounts={showCounts}
                    />
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            ))
          ) : (
            <ComboboxCollection>
              {(option: DataTableFilterOption) => (
                <DataTableFacetedFilterItem
                  key={option.value}
                  facetCounts={facetCounts}
                  option={option}
                  showCounts={showCounts}
                />
              )}
            </ComboboxCollection>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
