import { type ColumnFiltersState } from "@tanstack/react-table"

import { normalizeFilterText } from "@/components/data-table"

import { type AuditEvent } from "../types/audit-types"

const auditGlobalSearchFields: ReadonlyArray<(event: AuditEvent) => string> = [
  (event) => event.actorName,
  (event) => event.eventLabel,
  (event) => event.target,
  (event) => event.reason ?? "",
]

function resolveColumnFilterValues(
  columnFilters: ColumnFiltersState,
  columnId: string
) {
  const value = columnFilters.find((filter) => filter.id === columnId)?.value

  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value.map(String)
}

export function filterAuditEvents(
  events: readonly AuditEvent[],
  columnFilters: ColumnFiltersState,
  globalFilter: string
) {
  const eventFilters = resolveColumnFilterValues(columnFilters, "event")
  const scopeFilters = resolveColumnFilterValues(columnFilters, "scope")
  const severityFilters = resolveColumnFilterValues(columnFilters, "severity")
  const normalizedQuery = normalizeFilterText(globalFilter)

  return events.filter((event) => {
    if (eventFilters.length > 0 && !eventFilters.includes(event.event)) {
      return false
    }

    if (scopeFilters.length > 0 && !scopeFilters.includes(event.scope)) {
      return false
    }

    if (
      severityFilters.length > 0 &&
      !severityFilters.includes(event.severity)
    ) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    return auditGlobalSearchFields.some((field) =>
      normalizeFilterText(field(event)).includes(normalizedQuery)
    )
  })
}
