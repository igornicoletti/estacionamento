import type { ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { pricesCopy } from "../constants"
import {
  formatCurrency,
  formatIntegerUnit,
  formatNullableDateTime,
  priceScopeLabels,
  priceStatusLabels,
  type PriceStatus,
  type PriceTableRecord,
} from "../model"

function resolveStatusTone(status: PriceStatus) {
  if (status === "active") {
    return "success" as const
  }

  if (status === "draft") {
    return "warning" as const
  }

  return undefined
}

export function createPricesColumns(options: {
  onEdit?: (record: PriceTableRecord) => void
  onDetails?: (record: PriceTableRecord) => void
  onDeactivate?: (record: PriceTableRecord) => void
} = {}): ColumnDef<PriceTableRecord>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: pricesCopy.table.name },
      header: pricesCopy.table.name,
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onDetails?.(row.original)}>
          {row.original.name}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "scope",
      meta: { label: pricesCopy.table.scope },
      header: pricesCopy.table.scope,
      cell: ({ row }) =>
        row.original.scope === "global"
          ? "Rede"
          : priceScopeLabels[row.original.scope],
    },
    {
      accessorKey: "unitId",
      header: () => null,
      cell: () => null,
      enableHiding: false,
      meta: { enableExport: false },
    },
    {
      accessorKey: "unitName",
      meta: { label: pricesCopy.table.unit },
      header: pricesCopy.table.unit,
      cell: ({ row }) => row.original.unitName ?? "Todas as unidades",
    },
    {
      accessorKey: "amount",
      meta: { label: pricesCopy.table.amount },
      header: pricesCopy.table.amount,
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "cycleHours",
      meta: { label: pricesCopy.table.cycleHours },
      header: pricesCopy.table.cycleHours,
      cell: ({ row }) => formatIntegerUnit(row.original.cycleHours, "horas"),
    },
    {
      accessorKey: "graceMinutes",
      meta: { label: pricesCopy.table.graceMinutes },
      header: pricesCopy.table.graceMinutes,
      cell: ({ row }) => formatIntegerUnit(row.original.graceMinutes, "min"),
    },
    {
      accessorKey: "startsAt",
      meta: { label: pricesCopy.table.startsAt },
      header: pricesCopy.table.startsAt,
      cell: ({ row }) => formatNullableDateTime(row.original.startsAt),
    },
    {
      accessorKey: "endsAt",
      meta: { label: pricesCopy.table.endsAt },
      header: pricesCopy.table.endsAt,
      cell: ({ row }) => formatNullableDateTime(row.original.endsAt),
    },
    {
      accessorKey: "status",
      meta: { label: pricesCopy.table.status },
      header: pricesCopy.table.status,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={getBadgeToneClassName(resolveStatusTone(row.original.status))}
        >
          {priceStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    createActionsColumn<PriceTableRecord>([
      {
        id: "edit",
        label: pricesCopy.actions.edit,
        onSelect: (row) => options.onEdit?.(row.original),
      },
      {
        id: "deactivate",
        label: pricesCopy.actions.deactivate,
        variant: "destructive",
        onSelect: (row) => options.onDeactivate?.(row.original),
      },
      {
        id: "details",
        label: pricesCopy.actions.details,
        onSelect: (row) => options.onDetails?.(row.original),
      },
    ]),
  ]
}
