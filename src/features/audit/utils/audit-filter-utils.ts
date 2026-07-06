import { type ColumnFiltersState } from "@tanstack/react-table"

import { normalizeFilterText } from "@/components/data-table"

import { type AuditEvent } from "../types/audit-types"

const auditGlobalSearchFields: ReadonlyArray<(event: AuditEvent) => string> = [
  (event) => event.actorName,
  (event) => event.entity,
  (event) => event.unitName ?? "",
  (event) => event.ipAddress,
  (event) => event.userAgent,
  (event) => event.description,
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
  const actionFilters = resolveColumnFilterValues(columnFilters, "action")
  const outcomeFilters = resolveColumnFilterValues(columnFilters, "outcome")
  const roleFilters = resolveColumnFilterValues(columnFilters, "actorRole")
  const normalizedQuery = normalizeFilterText(globalFilter)

  return events.filter((event) => {
    if (actionFilters.length > 0 && !actionFilters.includes(event.action)) {
      return false
    }

    if (outcomeFilters.length > 0 && !outcomeFilters.includes(event.outcome)) {
      return false
    }

    const normalizedRole = event.actorRole ?? ""
    if (roleFilters.length > 0 && !roleFilters.includes(normalizedRole)) {
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
