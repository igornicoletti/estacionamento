import { type ColumnDef } from "@tanstack/react-table"

import { formatDateTime } from "@/lib"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
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
  return {
    title: `${event.eventLabel} · ${event.actorName}`,
    description: event.reason || "Sem informações adicionais.",
    items: [
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
    ],
  }
}

export function createAuditColumns(): ColumnDef<AuditEvent>[] {
  const detailsAction = createDataTableDetailsAction<AuditEvent>((row) =>
    getAuditEventDetails(row.original)
  )

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
        <DataTableDetails
          {...getAuditEventDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              {row.original.actorName}
            </DataTableDetailsTextTrigger>
          }
        />
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
      header: () => <div className="text-center text-[0.8rem] font-medium">Resultado</div>,
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
      header: () => <div className="text-center text-[0.8rem] font-medium">Severidade</div>,
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
    createActionsColumn<AuditEvent>([detailsAction]),
  ]
}
