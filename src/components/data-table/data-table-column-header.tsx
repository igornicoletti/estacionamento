import { type Column, type HeaderContext } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

function getSortButtonLabel(sortState: false | "asc" | "desc", title: string) {
  if (!sortState) {
    return `${dataTableCopy.accessibility.sortAscending}: ${title}`
  }

  if (sortState === "asc") {
    return `${dataTableCopy.accessibility.sortDescending}: ${title}`
  }

  return `${dataTableCopy.accessibility.clearSorting}: ${title}`
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sortState = column.getIsSorted()

  if (!column.getCanSort()) {
    return (
      <div className={cn("text-[0.8rem] font-medium leading-none", className)}>
        {title}
      </div>
    )
  }

  function handleSortClick() {
    if (!sortState) {
      column.toggleSorting(false)
      return
    }

    if (sortState === "asc") {
      column.toggleSorting(true)
      return
    }

    column.clearSorting()
  }

  const SortIcon =
    sortState === "desc"
      ? ArrowDown
      : sortState === "asc"
        ? ArrowUp
        : ChevronsUpDown

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        data-no-drag-scroll="true"
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 px-2 hover:bg-transparent! focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label={getSortButtonLabel(sortState, title)}
        onClick={handleSortClick}
      >
        <span>{title}</span>
        <SortIcon className="h-4 w-4 text-muted-foreground/40" />
      </Button>
    </div>
  )
}

export function createDataTableColumnHeader<TData, TValue>(title: string) {
  return ({ column }: HeaderContext<TData, TValue>) => (
    <DataTableColumnHeader column={column} title={title} />
  )
}
