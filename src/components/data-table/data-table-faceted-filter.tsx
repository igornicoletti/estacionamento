import { type Column } from "@tanstack/react-table"
import * as React from "react"

import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
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
        className="relative h-9 min-h-9 w-full min-w-44 flex-nowrap overflow-hidden lg:w-72"
      >
        {selectedOptions.length > 0 ? (
          <ComboboxValue>
            <span className="pointer-events-none absolute inset-x-2.5 top-1/2 -translate-y-1/2 truncate text-left whitespace-nowrap text-sm">
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
          <ComboboxCollection>
            {(option: DataTableFilterOption) => {
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
            }}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
