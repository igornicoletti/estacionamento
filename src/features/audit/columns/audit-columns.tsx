import { type ColumnDef } from "@tanstack/react-table"

import { formatDateTime } from "@/lib"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import {
  auditScopeLabels,
  auditSeverityLabels,
  type AuditEvent,
  type AuditSeverity,
} from "../types/audit-types"
import { auditCopy } from "../audit-copy"

const auditMetadataLabels: Readonly<Record<string, string>> = auditCopy.metadata.labels
const auditMetadataValueLabels: Readonly<Record<string, string>> = auditCopy.metadata.values

const hiddenAuditMetadataKeys = new Set([
  "registeredBy",
  "runId",
  "source",
])

function resolveAuditOutcomeVariant(event: AuditEvent) {
  if (event.success) {
    return "success" as const
  }

  if (event.severity === "critical") {
    return "destructive" as const
  }

  return "destructive" as const
}

function resolveAuditSeverityVariant(severity: AuditSeverity) {
  if (severity === "critical") {
    return "destructive" as const
  }

  if (severity === "warning") {
    return "warning" as const
  }

  return "info" as const
}

export function getAuditOutcomeLabel(event: AuditEvent) {
  if (event.success) {
    return auditCopy.labels.success
  }

  return event.severity === "critical"
    ? auditCopy.labels.critical
    : auditCopy.labels.failure
}

function humanizeAuditMetadataIdentifier(value: string) {
  const humanized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")

  if (!humanized) {
    return auditCopy.details.emptyValue
  }

  return humanized.charAt(0).toLocaleUpperCase("pt-BR") + humanized.slice(1)
}

function formatAuditMetadataValue(value: unknown) {
  if (typeof value === "string") {
    const mappedValue = auditMetadataValueLabels[value]

    if (mappedValue) {
      return mappedValue
    }

    if (/^[a-z][a-z0-9_.-]*$/i.test(value)) {
      return humanizeAuditMetadataIdentifier(value)
    }

    return value.replace(/[<>]/g, "")
  }

  if (typeof value === "number") {
    return Intl.NumberFormat("pt-BR").format(value)
  }

  if (typeof value === "boolean") {
    return value ? auditCopy.labels.yes : auditCopy.labels.no
  }

  return null
}

function getAuditMetadataDetails(event: AuditEvent) {
  if (!event.metadata) {
    return []
  }

  return Object.entries(event.metadata)
    .flatMap(([key, value]) => {
      if (hiddenAuditMetadataKeys.has(key) || !(key in auditMetadataLabels)) {
        return []
      }

      const formattedValue = formatAuditMetadataValue(value)

      return formattedValue
        ? [{ label: auditMetadataLabels[key], value: formattedValue }]
        : []
    })
}

export function getAuditEventDetails(event: AuditEvent) {
  return [
    { label: auditCopy.table.occurredAt, value: formatDateTime(event.occurredAt) },
    { label: auditCopy.table.responsible, value: event.actorName },
    { label: auditCopy.table.scope, value: auditScopeLabels[event.scope] },
    { label: auditCopy.table.event, value: event.eventLabel },
    { label: auditCopy.table.target, value: event.target || auditCopy.details.emptyValue },
    { label: auditCopy.table.outcome, value: getAuditOutcomeLabel(event) },
    { label: auditCopy.table.severity, value: auditSeverityLabels[event.severity] },
    { label: auditCopy.details.reason, value: event.reason ?? auditCopy.details.emptyValue },
    ...getAuditMetadataDetails(event),
  ]
}

export function createAuditColumns(options: {
  onOpenDetails?: (event: AuditEvent) => void
} = {}): ColumnDef<AuditEvent>[] {
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
