import {
  ActivityIcon,
  Layers3Icon,
  TriangleAlertIcon,
  UserRoundIcon,
} from "lucide-react"

import {
  createDataTableFilterOptions,
  type DataTableFilterField,
} from "@/components/data-table"

import { auditCopy } from "../constants/audit-copy"
import {
  auditScopeLabels,
  auditSeverityLabels,
} from "../constants/audit-labels"
import { getAuditEventLabel } from "../model/audit-event-labels"
import { getAuditEntityLabel } from "../model/audit-presentation"
import { type AuditEvent } from "../model/audit-types"

export function createAuditFilterFields(
  events: readonly AuditEvent[]
): readonly DataTableFilterField<AuditEvent>[] {
  return [
    {
      id: "actor",
      icon: UserRoundIcon,
      title: auditCopy.filters.responsible,
      options: createDataTableFilterOptions(
        events,
        (event) => getAuditEntityLabel(event.actor),
        (event) => getAuditEntityLabel(event.actor)
      ),
      showCounts: true,
    },
    {
      id: "scope",
      icon: Layers3Icon,
      title: auditCopy.filters.scopes,
      options: createDataTableFilterOptions(
        events,
        (event) => event.scope,
        (event) => auditScopeLabels[event.scope]
      ),
      showCounts: true,
    },
    {
      id: "event",
      icon: ActivityIcon,
      title: auditCopy.filters.events,
      options: createDataTableFilterOptions(
        events,
        (event) => getAuditEventLabel(event.event),
        (event) => getAuditEventLabel(event.event)
      ),
      showCounts: true,
    },
    {
      id: "severity",
      icon: TriangleAlertIcon,
      title: auditCopy.table.severity,
      options: createDataTableFilterOptions(
        events,
        (event) => event.severity,
        (event) => auditSeverityLabels[event.severity]
      ),
      showCounts: true,
    },
  ]
}
