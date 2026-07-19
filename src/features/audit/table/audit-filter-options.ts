import { type ColumnFiltersState } from "@tanstack/react-table"

import {
  createDataTableFilterOptions,
  type DataTableFilterField,
} from "@/components/data-table"

import { auditCopy, auditScopeLabels } from "../constants"
import {
  filterAuditEvents,
  removeAuditColumnFilter,
  type AuditEvent,
} from "../model"

interface CreateAuditFilterFieldsOptions {
  events: readonly AuditEvent[]
  columnFilters: ColumnFiltersState
  globalFilter: string
}

export function createAuditFilterFields({
  events,
  columnFilters,
  globalFilter,
}: CreateAuditFilterFieldsOptions): DataTableFilterField<AuditEvent>[] {
  const responsibleOptionEvents = filterAuditEvents(
    events,
    removeAuditColumnFilter(columnFilters, "actorName"),
    globalFilter
  )
  const scopeOptionEvents = filterAuditEvents(
    events,
    removeAuditColumnFilter(columnFilters, "scope"),
    globalFilter
  )
  const eventOptionEvents = filterAuditEvents(
    events,
    removeAuditColumnFilter(columnFilters, "event"),
    globalFilter
  )

  return [
    {
      id: "actorName",
      title: auditCopy.filters.responsible,
      options: createDataTableFilterOptions(
        responsibleOptionEvents,
        (event) => event.actorName,
        (event) => event.actorName
      ),
      showCounts: true,
    },
    {
      id: "scope",
      title: auditCopy.filters.scopes,
      options: createDataTableFilterOptions(
        scopeOptionEvents,
        (event) => event.scope,
        (event) => auditScopeLabels[event.scope]
      ),
      showCounts: true,
    },
    {
      id: "event",
      title: auditCopy.filters.events,
      options: createDataTableFilterOptions(
        eventOptionEvents,
        (event) => event.event,
        (event) => event.eventLabel
      ),
      showCounts: true,
    },
  ]
}
