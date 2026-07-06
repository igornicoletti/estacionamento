import { type ColumnDef } from "@tanstack/react-table"

import { userRoleLabels } from "@/features/auth"
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
  auditActionLabels,
  auditOutcomeLabels,
  type AuditEvent,
  type AuditOutcome,
} from "../types/audit-types"

function resolveAuditOutcomeVariant(outcome: AuditOutcome) {
  if (outcome === "success") {
    return "success" as const
  }

  if (outcome === "failure") {
    return "destructive" as const
  }

  return "warning" as const
}

function getActorRoleLabel(event: AuditEvent) {
  return event.actorRole ? userRoleLabels[event.actorRole] : "Sistema"
}

export function getAuditActorRoleLabel(event: AuditEvent) {
  return getActorRoleLabel(event)
}

export function getAuditEventDetails(event: AuditEvent) {
  return {
    title: `${auditActionLabels[event.action]} · ${event.actorName}`,
    description: event.description || "Sem descrição adicional.",
    items: [
      { label: "Data/hora", value: formatDateTime(event.occurredAt) },
      { label: "Responsável", value: event.actorName },
      { label: "Perfil", value: getActorRoleLabel(event) },
      { label: "Ação", value: auditActionLabels[event.action] },
      { label: "Resultado", value: auditOutcomeLabels[event.outcome] },
      { label: "Entidade", value: event.entity },
      { label: "Unidade", value: event.unitName ?? "—" },
      { label: "Endereço IP", value: event.ipAddress },
      { label: "Dispositivo", value: event.userAgent },
      { label: "Descrição", value: event.description },
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
      accessorKey: "actorRole",
      meta: { label: "Perfil" },
      header: "Perfil",
      cell: ({ row }) => getActorRoleLabel(row.original),
    },
    {
      accessorKey: "action",
      meta: { label: "Ação" },
      header: "Ação",
      cell: ({ row }) => auditActionLabels[row.original.action],
    },
    {
      accessorKey: "outcome",
      meta: { label: "Resultado" },
      header: () => <div className="text-center text-[0.8rem] font-medium">Resultado</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(resolveAuditOutcomeVariant(row.original.outcome))}
          >
            {auditOutcomeLabels[row.original.outcome]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "entity",
      meta: { label: "Entidade" },
      header: "Entidade",
    },
    {
      accessorKey: "unitName",
      meta: { label: "Unidade" },
      header: "Unidade",
      cell: ({ row }) => row.original.unitName ?? "—",
    },
    {
      accessorKey: "ipAddress",
      meta: { label: "IP" },
      header: "IP",
    },
    createActionsColumn<AuditEvent>([detailsAction]),
  ]
}
