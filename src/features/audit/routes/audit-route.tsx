import { type ColumnFiltersState } from "@tanstack/react-table"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import {
  createAuditColumns,
  getAuditActorRoleLabel,
} from "../columns/audit-columns"
import { useAudit } from "../hooks/use-audit"
import {
  auditActionLabels,
  auditOutcomeLabels,
} from "../types/audit-types"
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

  const actionOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.action,
        (event) => auditActionLabels[event.action]
      ),
    [events]
  )

  const outcomeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.outcome,
        (event) => auditOutcomeLabels[event.outcome]
      ),
    [events]
  )

  const roleOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.actorRole ?? "",
        (event) => getAuditActorRoleLabel(event)
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
          columnIds: [
            "actorName",
            "entity",
            "unitName",
            "ipAddress",
            "userAgent",
            "description",
          ],
          placeholder: "Buscar na auditoria...",
        }}
        globalFilterValue={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        filterFields={[
          {
            id: "action",
            title: "Ações",
            options: actionOptions,
          },
          {
            id: "outcome",
            title: "Resultados",
            options: outcomeOptions,
          },
          {
            id: "actorRole",
            title: "Perfis",
            options: roleOptions,
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
