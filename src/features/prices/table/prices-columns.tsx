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
  onStatusChange?: (record: PriceTableRecord) => void
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
      header: () => <div className="text-center font-medium">{pricesCopy.table.status}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(resolveStatusTone(row.original.status))}
          >
            {priceStatusLabels[row.original.status]}
          </Badge>
        </div>
      ),
    },
    createActionsColumn<PriceTableRecord>((row) => {
      const isActive = row.original.status === "active"

      return [
        {
          id: "details",
          label: pricesCopy.actions.details,
          onSelect: (selectedRow) => options.onDetails?.(selectedRow.original),
        },
        {
          id: "edit",
          label: pricesCopy.actions.edit,
          onSelect: (selectedRow) => options.onEdit?.(selectedRow.original),
        },
        ...(options.onStatusChange
          ? [
            {
              id: "status" as const,
              label: isActive ? pricesCopy.actions.deactivate : pricesCopy.actions.activate,
              variant: isActive ? "destructive" as const : "default" as const,
              separatorBefore: true,
              onSelect: (selectedRow: { original: PriceTableRecord }) => options.onStatusChange?.(selectedRow.original),
            },
          ]
          : []),
      ]
    }),
  ]
}
