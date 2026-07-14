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

import { createAuditColumns, getAuditEventDetails } from "../columns/audit-columns"
import { useAudit } from "../hooks/use-audit"
import {
  auditScopeLabels,
  auditSeverityLabels,
  type AuditEvent,
} from "../types/audit-types"
import { filterAuditEvents } from "../utils/audit-filter-utils"

const AUDIT_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.audit.columns.v2"
const AUDIT_TABLE_STATE_KEY = "rmc.table.audit.state.v2"

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

  const eventOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.event,
        (event) => event.eventLabel
      ),
    [events]
  )

  const scopeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.scope,
        (event) => auditScopeLabels[event.scope]
      ),
    [events]
  )

  const severityOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.severity,
        (event) => auditSeverityLabels[event.severity]
      ),
    [events]
  )

  return (
    <PageSection>
      <PageHeader
        title="Auditoria"
        subtitle={
          isTruncated
            ? `Acompanhe os eventos de segurança e ações realizadas. Exibindo os ${limit} eventos mais recentes.`
            : "Acompanhe os eventos de segurança e as ações realizadas no sistema."
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
          placeholder: "Buscar na auditoria...",
        }}
        globalFilterValue={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        filterFields={[
          {
            id: "event",
            title: "Eventos",
            options: eventOptions,
          },
          {
            id: "scope",
            title: "Escopos",
            options: scopeOptions,
          },
          {
            id: "severity",
            title: "Severidade",
            options: severityOptions,
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
        description={selectedEvent?.reason || "Sem informações adicionais."}
        items={selectedEvent ? getAuditEventDetails(selectedEvent) : []}
      />
    </PageSection>
  )
}
