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
  const visibleSelectedOptions = selectedOptions.slice(0, maxVisibleChips)
  const hiddenSelectedCount = Math.max(
    selectedOptions.length - visibleSelectedOptions.length,
    0
  )
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
        className="min-h-9 w-full min-w-44 overflow-hidden lg:w-64"
      >
        {selectedOptions.length > 0 ? (
          <ComboboxValue>
            <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              {visibleSelectedOptions.map((option) => (
                <ComboboxChip
                  key={option.value}
                  className="min-w-0 max-w-32 shrink-0"
                >
                  <span className="truncate">{option.label}</span>
                </ComboboxChip>
              ))}
              {hiddenSelectedCount > 0 ? (
                <ComboboxChip showRemove={false} className="shrink-0">
                  +{hiddenSelectedCount} {dataTableCopy.facetedFilter.selectedSuffix}
                </ComboboxChip>
              ) : null}
            </span>
          </ComboboxValue>
        ) : null}
        <ComboboxChipsInput
          aria-label={title}
          className="min-w-0 flex-1 text-left"
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
