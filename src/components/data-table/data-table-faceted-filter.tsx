import { type Column } from "@tanstack/react-table"
import { Check } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"
import { dedupeFilterOptions } from "./data-table-filter-utils"
import { type DataTableFilterOption } from "./data-table-types"

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  options: readonly DataTableFilterOption[]
  showCounts?: boolean
}

interface DataTableFacetedFilterOptionItemProps {
  label: string
  isSelected: boolean
  count?: number
  showCounts: boolean
  onToggle: () => void
}

function DataTableFacetedFilterOptionItem({
  label,
  isSelected,
  count,
  showCounts,
  onToggle,
}: DataTableFacetedFilterOptionItemProps) {
  return (
    <CommandItem onSelect={onToggle}>
      <div
        className={cn(
          "flex size-4 items-center justify-center rounded-lg border",
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input [&_svg]:invisible"
        )}
      >
        <Check className="size-3.5 text-primary-foreground" />
      </div>
      <span>{label}</span>
      {showCounts && Boolean(count) ? (
        <CommandShortcut>{count}</CommandShortcut>
      ) : null}
    </CommandItem>
  )
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  showCounts = true,
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

  if (!uniqueOptions.length) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-no-drag-scroll="true"
          type="button"
          variant="outline"
          className="border-dashed"
        >
          {title}
          {selectedValues.size > 0 ? (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} {dataTableCopy.facetedFilter.selectedSuffix}
                  </Badge>
                ) : (
                  uniqueOptions
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-no-drag-scroll="true"
        className="w-48 p-0"
        align="start"
      >
        <Command>
          <CommandInput data-no-drag-scroll="true" placeholder={title} />
          <CommandList>
            <CommandEmpty>{dataTableCopy.facetedFilter.noResults}</CommandEmpty>
            <CommandGroup>
              {uniqueOptions.map((option) => {
                const isSelected = selectedValues.has(option.value)
                const count = facetCounts?.get(option.value)

                return (
                  <DataTableFacetedFilterOptionItem
                    key={option.value}
                    label={option.label}
                    isSelected={isSelected}
                    count={count}
                    showCounts={showCounts}
                    onToggle={() => {
                      const nextSelectedValues = new Set(selectedValues)

                      if (isSelected) {
                        nextSelectedValues.delete(option.value)
                      } else {
                        nextSelectedValues.add(option.value)
                      }

                      const filterValues = Array.from(nextSelectedValues)

                      column.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      )
                    }}
                  />
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      column.setFilterValue(undefined)
                    }}
                    className="justify-center text-center [&>svg:last-child]:hidden"
                  >
                    <span className="w-full text-center">
                      {dataTableCopy.facetedFilter.clearFilters}
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
