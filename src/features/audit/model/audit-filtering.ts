import { type ColumnFiltersState } from "@tanstack/react-table"

import { normalizeFilterText } from "@/components/data-table"

import { type AuditEvent } from "./audit-types"

const auditGlobalSearchFields: ReadonlyArray<(event: AuditEvent) => string> = [
  (event) => event.actorName,
  (event) => event.eventLabel,
  (event) => event.target,
  (event) => event.reason ?? "",
]

function resolveColumnFilterValues(
  columnFilters: ColumnFiltersState,
  columnId: keyof AuditEvent
) {
  const value = columnFilters.find((filter) => filter.id === columnId)?.value

  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value.map(String)
}

export function removeAuditColumnFilter(
  columnFilters: ColumnFiltersState,
  columnId: keyof AuditEvent
) {
  return columnFilters.filter((filter) => filter.id !== columnId)
}

export function filterAuditEvents(
  events: readonly AuditEvent[],
  columnFilters: ColumnFiltersState,
  globalFilter: string
) {
  const responsibleFilters = resolveColumnFilterValues(columnFilters, "actorName")
  const eventFilters = resolveColumnFilterValues(columnFilters, "event")
  const scopeFilters = resolveColumnFilterValues(columnFilters, "scope")
  const normalizedQuery = normalizeFilterText(globalFilter)

  return events.filter((event) => {
    if (
      responsibleFilters.length > 0 &&
      !responsibleFilters.includes(event.actorName)
    ) {
      return false
    }

    if (eventFilters.length > 0 && !eventFilters.includes(event.event)) {
      return false
    }

    if (scopeFilters.length > 0 && !scopeFilters.includes(event.scope)) {
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
