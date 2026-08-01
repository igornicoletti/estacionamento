import { type Column } from "@tanstack/react-table"
import { XIcon, type LucideIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/combobox"

import { dataTableCopy } from "./data-table-copy"
import { DataTableFilterIcon } from "./data-table-filter-icon"
import { dedupeFilterOptions } from "./data-table-filter-utils"
import {
  type DataTableFacetCountSource,
  type DataTableFilterOption,
  type DataTableFilterOptionGroup,
} from "./data-table-types"

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  icon: LucideIcon
  title: string
  options: readonly DataTableFilterOption[]
  groups?: readonly DataTableFilterOptionGroup[]
  placeholder?: string
  showCounts?: boolean
  facetCountSource?: DataTableFacetCountSource
  facetValueToOptionValue?: (value: unknown) => string | null
  defaultOpen?: boolean
  onRemove: () => void
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

function normalizeVisibleText(value: string | undefined): string {
  return value?.trim().replace(/\s+/gu, " ").normalize("NFC") ?? ""
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
    const label = normalizeVisibleText(group.label)
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

export function resolveDataTableFacetedFilterTriggerLabel(
  title: string,
  selectedOptions: readonly DataTableFilterOption[]
): string {
  if (selectedOptions.length === 0) return title
  if (selectedOptions.length === 1) return selectedOptions[0]?.label ?? title

  const firstLabel = selectedOptions[0]?.label ?? title
  return `${firstLabel} +${selectedOptions.length - 1}`
}

function DataTableFacetedFilterItem({
  option,
  count,
}: {
  option: DataTableFilterOption
  count?: number
}) {
  return (
    <ComboboxItem
      value={option}
      className="pr-1.5 [&>span:last-child]:static [&>span:last-child]:right-auto [&>span:last-child]:order-2 [&>span:last-child]:ml-auto"
    >
      <span
        className="min-w-0 flex-1 truncate"
        data-slot="data-table-filter-item-label"
      >
        {option.label}
      </span>
      {count !== undefined ? (
        <span
          className="order-3 flex shrink-0 items-center"
          data-slot="data-table-filter-item-meta"
        >
          <span className="text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        </span>
      ) : null}
    </ComboboxItem>
  )
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  icon,
  title,
  options,
  groups = [],
  placeholder,
  showCounts = true,
  facetCountSource = "column",
  facetValueToOptionValue,
  defaultOpen = false,
  onRemove,
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
  const selectedValues = normalizeSelectedFilterValues(
    column.getFilterValue(),
    validOptionValues
  )
  const selectedOptions = selectedValues.flatMap((value) => {
    const option = optionsByValue.get(value)
    return option ? [option] : []
  })
  const optionLayout = React.useMemo(
    () => resolveFilterOptionLayout(uniqueOptions, groups),
    [groups, uniqueOptions]
  )
  const filterLabel =
    normalizeVisibleText(title) || dataTableCopy.toolbar.addFilter
  const filterPlaceholder =
    normalizeVisibleText(placeholder) ||
    `${dataTableCopy.toolbar.searchFilterPlaceholderPrefix} ${filterLabel.toLocaleLowerCase("pt-BR")}`
  const triggerLabel = resolveDataTableFacetedFilterTriggerLabel(
    filterLabel,
    selectedOptions
  )
  const hasSelection = selectedOptions.length > 0
  const triggerAriaLabel = `${dataTableCopy.toolbar.filterPlaceholderPrefix} ${filterLabel}`
  const inputAriaLabel = `${dataTableCopy.toolbar.searchFilterPlaceholderPrefix} ${filterLabel}`
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

  const handleRemove = React.useCallback(() => {
    column.setFilterValue(undefined)
    onRemove()
  }, [column, onRemove])

  const handleClearSelection = React.useCallback(() => {
    column.setFilterValue(undefined)
  }, [column])

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
    <div className="relative max-w-full shrink-0">
      <Combobox
        items={uniqueOptions}
        multiple
        defaultOpen={defaultOpen}
        value={selectedOptions}
        onValueChange={(
          value: DataTableFilterOption | DataTableFilterOption[] | null
        ) => column.setFilterValue(resolveNextFilterValue(value))}
        itemToStringValue={(option: DataTableFilterOption) => option.label}
      >
        <ComboboxTrigger
          data-no-drag-scroll="true"
          data-slot="data-table-filter-trigger"
          render={
            <Button
              type="button"
              variant={hasSelection ? "secondary" : "outline"}
              className="h-9 w-fit max-w-72 rounded-full px-3 pr-9"
            />
          }
          aria-label={triggerAriaLabel}
        >
          <DataTableFilterIcon
            icon={icon}
          />
          <span className="max-w-56 truncate">{triggerLabel}</span>
        </ComboboxTrigger>

        <ComboboxContent className="w-72 max-w-[calc(100vw-2rem)] min-w-56">
          <ComboboxInput
            aria-label={inputAriaLabel}
            placeholder={filterPlaceholder}
            showTrigger={false}
          />
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

          {hasSelection ? (
            <>
              <ComboboxSeparator />
              <div className="p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  aria-label={`${dataTableCopy.facetedFilter.clearFilterAriaLabelPrefix}: ${filterLabel}`}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={handleClearSelection}
                >
                  {dataTableCopy.facetedFilter.clearFilter}
                </Button>
              </div>
            </>
          ) : null}
        </ComboboxContent>
      </Combobox>

      <Button
        data-no-drag-scroll="true"
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
        aria-label={`${dataTableCopy.toolbar.removeFilterPrefix}: ${filterLabel}`}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          handleRemove()
        }}
      >
        <XIcon aria-hidden="true" data-icon="icon-only" />
      </Button>
    </div>
  )
}
