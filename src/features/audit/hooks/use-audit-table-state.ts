import {
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import * as React from "react"

import { filterAuditEvents, type AuditEvent } from "../model"
import { createAuditColumns, createAuditFilterFields } from "../table"

export function useAuditTableState(
  events: readonly AuditEvent[],
  onOpenDetails: (event: AuditEvent) => void
) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "occurredAt", desc: true },
  ])

  const columns = React.useMemo(
    () => createAuditColumns({ onOpenDetails }),
    [onOpenDetails]
  )

  const filteredEvents = React.useMemo(
    () => filterAuditEvents(events, columnFilters, globalFilter),
    [columnFilters, events, globalFilter]
  )

  const filterFields = React.useMemo(
    () => createAuditFilterFields({ events, columnFilters, globalFilter }),
    [columnFilters, events, globalFilter]
  )

  return {
    columnFilters,
    columns,
    filteredEvents,
    filterFields,
    globalFilter,
    setColumnFilters,
    setGlobalFilter,
    setSorting,
    sorting,
  }
}
