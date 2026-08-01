import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import { auditCopy } from "../constants/audit-copy"
import {
  auditScopeLabels,
  auditSeverityLabels,
} from "../constants/audit-labels"
import { getAuditEventLabel } from "../model/audit-event-labels"
import {
  getAuditOutcomeLabel,
  resolveAuditOutcomeVariant,
  resolveAuditSeverityVariant,
} from "../model/audit-outcome"
import {
  formatAuditDisplayText,
  getAuditEntityLabel,
} from "../model/audit-presentation"
import { type AuditEvent } from "../model/audit-types"

interface CreateAuditColumnsOptions {
  onOpenDetails: (event: AuditEvent) => void
}

export function createAuditColumns({
  onOpenDetails,
}: CreateAuditColumnsOptions): ColumnDef<AuditEvent>[] {
  return [
    {
      id: "occurredAt",
      accessorFn: (event) => Date.parse(event.occurredAt),
      meta: {
        label: auditCopy.table.occurredAt,
        exportValue: (_value, event) => formatDateTime(event.occurredAt),
      },
      header: auditCopy.table.occurredAt,
      cell: ({ row }) => formatDateTime(row.original.occurredAt),
    },
    {
      id: "actor",
      accessorFn: (event) => getAuditEntityLabel(event.actor),
      meta: { label: auditCopy.table.responsible },
      header: auditCopy.table.responsible,
      cell: ({ getValue, row }) => (
        <DataTableTextAction onClick={() => onOpenDetails(row.original)}>
          {String(getValue())}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "scope",
      meta: {
        label: auditCopy.table.scope,
        exportValue: (_value, event) => auditScopeLabels[event.scope],
      },
      header: auditCopy.table.scope,
      cell: ({ row }) => auditScopeLabels[row.original.scope],
    },
    {
      id: "event",
      accessorFn: (event) => getAuditEventLabel(event.event),
      meta: { label: auditCopy.table.event },
      header: auditCopy.table.event,
    },
    {
      id: "target",
      accessorFn: (event) =>
        getAuditEntityLabel(event.target) || auditCopy.details.emptyValue,
      meta: { label: auditCopy.table.target },
      header: auditCopy.table.target,
    },
    {
      id: "outcome",
      accessorFn: (event) => getAuditOutcomeLabel(event),
      meta: { label: auditCopy.table.outcome },
      header: () => <div className="text-center">{auditCopy.table.outcome}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(
              resolveAuditOutcomeVariant(row.original)
            )}
          >
            {getAuditOutcomeLabel(row.original)}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "severity",
      meta: {
        label: auditCopy.table.severity,
        exportValue: (_value, event) =>
          auditSeverityLabels[event.severity],
      },
      header: () => <div className="text-center">{auditCopy.table.severity}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(
              resolveAuditSeverityVariant(row.original.severity)
            )}
          >
            {auditSeverityLabels[row.original.severity]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "id",
      meta: { label: auditCopy.table.eventId },
      header: auditCopy.table.eventId,
    },
    {
      id: "reason",
      accessorFn: (event) =>
        event.reason
          ? formatAuditDisplayText(event.reason)
          : auditCopy.details.emptyValue,
      meta: { label: auditCopy.details.reason },
      header: auditCopy.details.reason,
    },
    {
      accessorKey: "requestId",
      meta: {
        label: auditCopy.details.requestId,
        exportValue: (value) =>
          typeof value === "string" ? value : auditCopy.details.emptyValue,
      },
      header: auditCopy.details.requestId,
      cell: ({ row }) => row.original.requestId ?? auditCopy.details.emptyValue,
    },
    createActionsColumn<AuditEvent>([
      {
        id: "details",
        label: auditCopy.actions.details,
        onSelect: (row) => onOpenDetails(row.original),
      },
    ]),
  ]
}
