import { type ColumnDef } from "@tanstack/react-table"

import { formatDateTime } from "@/lib"

import { createActionsColumn } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import {
  auditScopeLabels,
  auditSeverityLabels,
  type AuditEvent,
  type AuditSeverity,
} from "../types/audit-types"

function resolveAuditOutcomeVariant(event: AuditEvent) {
  if (event.success) {
    return "success" as const
  }

  if (event.severity === "critical") {
    return "destructive" as const
  }

  return "warning" as const
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
    return "Sucesso"
  }

  return event.severity === "critical" ? "Crítico" : "Falha"
}

export function getAuditEventDetails(event: AuditEvent) {
  return [
    { label: "Data/hora", value: formatDateTime(event.occurredAt) },
    { label: "Responsável", value: event.actorName },
    { label: "Escopo", value: auditScopeLabels[event.scope] },
    { label: "Evento", value: event.eventLabel },
    { label: "Alvo", value: event.target || "—" },
    { label: "Resultado", value: getAuditOutcomeLabel(event) },
    { label: "Severidade", value: auditSeverityLabels[event.severity] },
    { label: "Motivo", value: event.reason ?? "—" },
    {
      label: "Detalhes",
      value: event.metadata ? JSON.stringify(event.metadata) : "—",
    },
  ]
}

export function createAuditColumns(options: {
  onOpenDetails?: (event: AuditEvent) => void
} = {}): ColumnDef<AuditEvent>[] {
  return [
    {
      accessorKey: "occurredAt",
      meta: { label: "Data/hora" },
      header: "Data/hora",
      cell: ({ row }) => formatDateTime(row.original.occurredAt),
    },
    {
      accessorKey: "actorName",
      meta: { label: "Responsável" },
      header: "Responsável",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-left font-medium"
          onClick={() => {
            options.onOpenDetails?.(row.original)
          }}
        >
          {row.original.actorName}
        </Button>
      ),
    },
    {
      accessorKey: "scope",
      meta: { label: "Escopo" },
      header: "Escopo",
      cell: ({ row }) => auditScopeLabels[row.original.scope],
    },
    {
      accessorKey: "event",
      meta: { label: "Evento" },
      header: "Evento",
      cell: ({ row }) => row.original.eventLabel,
    },
    {
      accessorKey: "target",
      meta: { label: "Alvo" },
      header: "Alvo",
      cell: ({ row }) => row.original.target || "—",
    },
    {
      id: "outcome",
      meta: { label: "Resultado" },
      header: () => <div className="text-center">Resultado</div>,
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
      meta: { label: "Severidade" },
      header: () => <div className="text-center">Severidade</div>,
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
        label: "Detalhes",
        onSelect: (row) => {
          options.onOpenDetails?.(row.original)
        },
      },
    ]),
  ]
}
