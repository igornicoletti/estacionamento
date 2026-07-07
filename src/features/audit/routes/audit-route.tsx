import { type ColumnFiltersState } from "@tanstack/react-table"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { createAuditColumns } from "../columns/audit-columns"
import { useAudit } from "../hooks/use-audit"
import { auditScopeLabels, auditSeverityLabels } from "../types/audit-types"
import { filterAuditEvents } from "../utils/audit-filter-utils"

const AUDIT_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.audit.columns.v1"

export function AuditRoute() {
  const { data: events, error, isLoading, refetch } = useAudit()
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const columns = React.useMemo(() => createAuditColumns(), [])

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
        subtitle="Acompanhe os eventos de segurança e as ações realizadas no sistema."
      />

      <DataTable
        columns={columns}
        data={filteredEvents}
        columnVisibilityStorageKey={AUDIT_TABLE_COLUMN_VISIBILITY_KEY}
        tableStateStorageKey="rmc.table.audit.state.v1"
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
    </PageSection>
  )
}
