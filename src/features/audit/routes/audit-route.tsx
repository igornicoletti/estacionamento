import {
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"

import { auditCopy } from "../audit-copy"
import { createAuditColumns, getAuditEventDetails } from "../columns/audit-columns"
import { useAudit } from "../hooks/use-audit"
import {
  auditScopeLabels,
  type AuditEvent,
} from "../types/audit-types"
import { filterAuditEvents } from "../utils/audit-filter-utils"

const AUDIT_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.audit.columns.v2"
const AUDIT_TABLE_STATE_KEY = "rmc.table.audit.state.v2"

function removeColumnFilter(
  columnFilters: ColumnFiltersState,
  columnId: keyof AuditEvent
) {
  return columnFilters.filter((filter) => filter.id !== columnId)
}

export function AuditRoute() {
  const {
    data: events,
    error,
    isLoading,
    isTruncated,
    limit,
    refetch,
  } = useAudit()
  const [selectedEvent, setSelectedEvent] = React.useState<AuditEvent | null>(null)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "occurredAt", desc: true },
  ])
  const columns = React.useMemo(
    () => createAuditColumns({ onOpenDetails: setSelectedEvent }),
    []
  )

  const filteredEvents = React.useMemo(
    () => filterAuditEvents(events, columnFilters, globalFilter),
    [columnFilters, events, globalFilter]
  )

  const responsibleOptionEvents = React.useMemo(
    () =>
      filterAuditEvents(
        events,
        removeColumnFilter(columnFilters, "actorName"),
        globalFilter
      ),
    [columnFilters, events, globalFilter]
  )

  const scopeOptionEvents = React.useMemo(
    () =>
      filterAuditEvents(
        events,
        removeColumnFilter(columnFilters, "scope"),
        globalFilter
      ),
    [columnFilters, events, globalFilter]
  )

  const eventOptionEvents = React.useMemo(
    () =>
      filterAuditEvents(
        events,
        removeColumnFilter(columnFilters, "event"),
        globalFilter
      ),
    [columnFilters, events, globalFilter]
  )

  const responsibleOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        responsibleOptionEvents,
        (event) => event.actorName,
        (event) => event.actorName
      ),
    [responsibleOptionEvents]
  )

  const eventOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        eventOptionEvents,
        (event) => event.event,
        (event) => event.eventLabel
      ),
    [eventOptionEvents]
  )

  const scopeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        scopeOptionEvents,
        (event) => event.scope,
        (event) => auditScopeLabels[event.scope]
      ),
    [scopeOptionEvents]
  )

  return (
    <PageSection>
      <PageHeader
        title={auditCopy.page.title}
        subtitle={
          isTruncated
            ? auditCopy.page.truncatedSubtitle(limit)
            : auditCopy.page.subtitle
        }
      />

      <DataTable
        columns={columns}
        data={filteredEvents}
        sourceRowCount={events.length}
        columnVisibilityStorageKey={AUDIT_TABLE_COLUMN_VISIBILITY_KEY}
        tableStateStorageKey={AUDIT_TABLE_STATE_KEY}
        getRowId={(event) => event.id}
        manualFiltering
        globalSearch={{
          columnIds: ["actorName", "event", "target"],
          placeholder: auditCopy.page.searchPlaceholder,
        }}
        globalFilterValue={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        filterFields={[
          {
            id: "actorName",
            title: auditCopy.filters.responsible,
            options: responsibleOptions,
            showCounts: true,
          },
          {
            id: "scope",
            title: auditCopy.filters.scopes,
            options: scopeOptions,
            showCounts: true,
          },
          {
            id: "event",
            title: auditCopy.filters.events,
            options: eventOptions,
            showCounts: true,
          },
        ]}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null)
          }
        }}
        title={selectedEvent ? `${selectedEvent.eventLabel} · ${selectedEvent.actorName}` : undefined}
        description={selectedEvent?.reason || auditCopy.details.fallbackDescription}
        items={selectedEvent ? getAuditEventDetails(selectedEvent) : []}
      />
    </PageSection>
  )
}
