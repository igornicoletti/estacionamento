import { type Column, type HeaderContext } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"

export type DataTableColumnHeaderAlignment = "start" | "center" | "end"
type DataTableSortDirection = false | "asc" | "desc"

const alignmentClassNames: Record<DataTableColumnHeaderAlignment, string> = {
  start: "justify-start text-left",
  center: "justify-center text-center",
  end: "justify-end text-right",
}

interface DataTableColumnHeaderProps<TData, TValue>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  column: Column<TData, TValue>
  title: string
  align?: DataTableColumnHeaderAlignment
  buttonClassName?: string
}

interface DataTableColumnHeaderFactoryOptions {
  align?: DataTableColumnHeaderAlignment
  className?: string
  buttonClassName?: string
}

function getSortButtonLabel(
  nextSortDirection: DataTableSortDirection,
  title: string
): string {
  if (nextSortDirection === "asc") {
    return `${dataTableCopy.accessibility.sortAscending}: ${title}`
  }
  if (nextSortDirection === "desc") {
    return `${dataTableCopy.accessibility.sortDescending}: ${title}`
  }
  return `${dataTableCopy.accessibility.clearSorting}: ${title}`
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = "start",
  className,
  buttonClassName,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  const alignmentClassName = alignmentClassNames[align]

  if (!column.getCanSort()) {
    return (
      <div
        {...props}
        className={cn(
          "flex min-w-0 w-full items-center",
          alignmentClassName,
          className
        )}
      >
        <span className="truncate text-sm font-medium">{title}</span>
      </div>
    )
  }

  const sortState = column.getIsSorted()
  const nextSortDirection = column.getNextSortingOrder()
  const SortIcon =
    sortState === "desc"
      ? ArrowDown
      : sortState === "asc"
        ? ArrowUp
        : ChevronsUpDown

  return (
    <div
      {...props}
      className={cn("flex min-w-0 w-full items-center", className)}
    >
      <Button
        data-no-drag-scroll="true"
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 w-full min-w-0 gap-1.5 px-2 font-medium hover:bg-transparent data-[state=active]:bg-transparent",
          alignmentClassName,
          buttonClassName
        )}
        aria-label={getSortButtonLabel(nextSortDirection, title)}
        onClick={column.getToggleSortingHandler()}
      >
        <span className="min-w-0 truncate">{title}</span>
        <SortIcon
          data-icon="inline-end"
          aria-hidden="true"
          focusable="false"
          className="shrink-0 text-muted-foreground"
        />
      </Button>
    </div>
  )
}

export function createDataTableColumnHeader<TData, TValue>(
  title: string,
  {
    align,
    className,
    buttonClassName,
  }: DataTableColumnHeaderFactoryOptions = {}
) {
  return ({ column }: HeaderContext<TData, TValue>) => (
    <DataTableColumnHeader
      column={column}
      title={title}
      align={align}
      className={className}
      buttonClassName={buttonClassName}
    />
  )
}
