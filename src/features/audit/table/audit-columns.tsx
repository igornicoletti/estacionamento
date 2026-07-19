import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import {
  auditCopy,
  auditScopeLabels,
  auditSeverityLabels,
} from "../constants"
import {
  getAuditOutcomeLabel,
  resolveAuditOutcomeVariant,
  resolveAuditSeverityVariant,
  type AuditEvent,
} from "../model"

export function createAuditColumns(
  options: {
    onOpenDetails?: (event: AuditEvent) => void
  } = {}
): ColumnDef<AuditEvent>[] {
  return [
    {
      accessorKey: "occurredAt",
      meta: { label: auditCopy.table.occurredAt },
      header: auditCopy.table.occurredAt,
      cell: ({ row }) => formatDateTime(row.original.occurredAt),
    },
    {
      accessorKey: "actorName",
      meta: { label: auditCopy.table.responsible },
      header: auditCopy.table.responsible,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            options.onOpenDetails?.(row.original)
          }}
        >
          {row.original.actorName}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "scope",
      meta: { label: auditCopy.table.scope },
      header: auditCopy.table.scope,
      cell: ({ row }) => auditScopeLabels[row.original.scope],
    },
    {
      accessorKey: "event",
      meta: { label: auditCopy.table.event },
      header: auditCopy.table.event,
      cell: ({ row }) => row.original.eventLabel,
    },
    {
      accessorKey: "target",
      meta: { label: auditCopy.table.target },
      header: auditCopy.table.target,
      cell: ({ row }) => row.original.target || auditCopy.details.emptyValue,
    },
    {
      id: "outcome",
      meta: { label: auditCopy.table.outcome },
      header: () => <div className="text-center">{auditCopy.table.outcome}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(resolveAuditOutcomeVariant(row.original))}
          >
            {getAuditOutcomeLabel(row.original)}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "severity",
      meta: { label: auditCopy.table.severity },
      header: () => <div className="text-center">{auditCopy.table.severity}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(resolveAuditSeverityVariant(row.original.severity))}
          >
            {auditSeverityLabels[row.original.severity]}
          </Badge>
        </div>
      ),
    },
    createActionsColumn<AuditEvent>([
      {
        id: "details",
        label: auditCopy.actions.details,
        onSelect: (row) => {
          options.onOpenDetails?.(row.original)
        },
      },
    ]),
  ]
}
