import { type Column } from "@tanstack/react-table"
import { XIcon, type LucideIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

import { dataTableCopy } from "./data-table-copy"
import { DataTableFilterIcon } from "./data-table-filter-icon"
import { DataTableSearchInput } from "./data-table-search-input"

interface DataTableSearchFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  icon: LucideIcon
  title: string
  ariaLabel?: string
  placeholder?: string
  defaultOpen?: boolean
  onRemove: () => void
}

function normalizeVisibleText(value: string | undefined): string {
  return value?.trim().replace(/\s+/gu, " ").normalize("NFC") ?? ""
}

export function DataTableSearchFilter<TData, TValue>({
  column,
  icon,
  title,
  ariaLabel,
  placeholder,
  defaultOpen = false,
  onRemove,
}: DataTableSearchFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(defaultOpen)
  const rawValue = column.getFilterValue()
  const value = typeof rawValue === "string" ? rawValue : ""
  const normalizedValue = normalizeVisibleText(value)
  const normalizedTitle =
    normalizeVisibleText(title) || dataTableCopy.toolbar.search
  const triggerLabel = normalizedValue || normalizedTitle
  const resolvedAriaLabel =
    normalizeVisibleText(ariaLabel) ||
    `${dataTableCopy.toolbar.filterPlaceholderPrefix} ${normalizedTitle}`
  const resolvedPlaceholder =
    normalizeVisibleText(placeholder) ||
    `${dataTableCopy.toolbar.searchFilterPlaceholderPrefix} ${normalizedTitle.toLocaleLowerCase("pt-BR")}`

  const handleRemove = React.useCallback(() => {
    column.setFilterValue(undefined)
    setOpen(false)
    onRemove()
  }, [column, onRemove])

  const handleClearValue = React.useCallback(() => {
    column.setFilterValue(undefined)
  }, [column])

  return (
    <div className="relative max-w-full shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            data-no-drag-scroll="true"
            data-slot="data-table-filter-trigger"
            type="button"
            variant={normalizedValue ? "secondary" : "outline"}
            className="h-9 w-fit max-w-72 rounded-full px-3 pr-9"
            aria-label={resolvedAriaLabel}
          >
            <DataTableFilterIcon
              icon={icon}
            />
            <span className="max-w-56 truncate">{triggerLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <DataTableSearchInput
            ariaLabel={resolvedAriaLabel}
            placeholder={resolvedPlaceholder}
            value={value}
            className="w-72 max-w-[calc(100vw-3rem)] lg:w-72 xl:w-72"
            onValueChange={(nextValue) =>
              column.setFilterValue(nextValue || undefined)
            }
            onClear={handleClearValue}
          />

          {normalizedValue ? (
            <>
              <Separator className="-mx-2 my-2 w-auto" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                aria-label={`${dataTableCopy.facetedFilter.clearFilterAriaLabelPrefix}: ${normalizedTitle}`}
                onClick={handleClearValue}
              >
                {dataTableCopy.facetedFilter.clearFilter}
              </Button>
            </>
          ) : null}
        </PopoverContent>
      </Popover>

      <Button
        data-no-drag-scroll="true"
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
        aria-label={`${dataTableCopy.toolbar.removeFilterPrefix}: ${normalizedTitle}`}
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
