import { type Column } from "@tanstack/react-table"
import * as React from "react"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"

import { dataTableCopy } from "./data-table-copy"
import { dedupeFilterOptions } from "./data-table-filter-utils"
import { type DataTableFilterOption } from "./data-table-types"

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  options: readonly DataTableFilterOption[]
  showCounts?: boolean
  maxVisibleChips?: number
}

const DEFAULT_MAX_VISIBLE_CHIPS = 2

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

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
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
  const visibleSelectedOptions = selectedOptions.slice(0, maxVisibleChips)
  const hiddenSelectedCount = Math.max(
    selectedOptions.length - visibleSelectedOptions.length,
    0
  )

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
        data-no-drag-scroll="true"
        className="min-h-9 w-full min-w-44 lg:w-56"
      >
        <ComboboxValue>
          {visibleSelectedOptions.map((option) => (
            <ComboboxChip key={option.value}>{option.label}</ComboboxChip>
          ))}
          {hiddenSelectedCount > 0 ? (
            <ComboboxChip>
              +{hiddenSelectedCount} {dataTableCopy.facetedFilter.selectedSuffix}
            </ComboboxChip>
          ) : null}
        </ComboboxValue>
        <ComboboxChipsInput placeholder={title} />
      </ComboboxChips>
      <ComboboxContent data-no-drag-scroll="true" className="min-w-(--anchor-width)">
        <ComboboxEmpty>{dataTableCopy.facetedFilter.noResults}</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(option: DataTableFilterOption) => {
              const count = facetCounts?.get(option.value)

              return (
                <ComboboxItem key={option.value} value={option}>
                  <span>{option.label}</span>
                  {showCounts && Boolean(count) ? (
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  ) : null}
                </ComboboxItem>
              )
            }}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
