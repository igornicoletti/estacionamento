import * as React from "react"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"

import {
  AUDIT_TABLE_COLUMN_VISIBILITY_KEY,
  AUDIT_TABLE_STATE_KEY,
  auditCopy,
} from "../constants"
import { useAudit, useAuditTableState } from "../hooks"
import { getAuditEventDetails, type AuditEvent } from "../model"

export function AuditRoute() {
  const { data: events, error, isLoading, isTruncated, limit, refetch } = useAudit()
  const [selectedEvent, setSelectedEvent] = React.useState<AuditEvent | null>(null)
  const {
    columnFilters,
    columns,
    filteredEvents,
    filterFields,
    globalFilter,
    setColumnFilters,
    setGlobalFilter,
    setSorting,
    sorting,
  } = useAuditTableState(events, setSelectedEvent)

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
        filterFields={filterFields}
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
