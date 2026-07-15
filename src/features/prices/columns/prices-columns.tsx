import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { pricesCopy } from "../prices-copy"
import { type PriceTable } from "../types/prices-types"
import {
  formatPriceCharge,
  formatPriceDate,
  formatPriceHours,
  formatPriceMinutes,
  getPriceScopeLabel,
  getPriceStatusLabel,
  getPriceUnitLabel,
} from "../utils/prices-models"

interface CreatePricesColumnsOptions {
  onOpenDetails?: (price: PriceTable) => void
  onTogglePriceStatus?: (price: PriceTable) => void
  canManage?: boolean
}

export function createPricesColumns({
  onOpenDetails,
  onTogglePriceStatus,
  canManage = false,
}: CreatePricesColumnsOptions = {}): ColumnDef<PriceTable>[] {
  return [
    {
      accessorKey: "scope",
      meta: { label: pricesCopy.table.scope },
      header: pricesCopy.table.scope,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={getBadgeToneClassName(row.original.scope === "network" ? "info" : undefined)}
        >
          {getPriceScopeLabel(row.original)}
        </Badge>
      ),
    },
    {
      accessorKey: "unitName",
      meta: { label: pricesCopy.table.unit },
      header: pricesCopy.table.unit,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails?.(row.original)
          }}
        >
          {getPriceUnitLabel(row.original)}
        </DataTableTextAction>
      ),
    },
    {
      id: "charge",
      accessorFn: (price) => formatPriceCharge(price),
      meta: { label: pricesCopy.table.charge },
      header: pricesCopy.table.charge,
      cell: ({ row }) => (
        <span className="block max-w-80 truncate tabular-nums">
          {formatPriceCharge(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "cycleHours",
      meta: { label: pricesCopy.table.cycle },
      header: pricesCopy.table.cycle,
      cell: ({ row }) => formatPriceHours(row.original.cycleHours),
    },
    {
      accessorKey: "graceMinutes",
      meta: { label: pricesCopy.table.grace },
      header: pricesCopy.table.grace,
      cell: ({ row }) => formatPriceMinutes(row.original.graceMinutes),
    },
    {
      accessorKey: "toleranceMinutes",
      meta: { label: pricesCopy.table.tolerance },
      header: pricesCopy.table.tolerance,
      cell: ({ row }) => formatPriceMinutes(row.original.toleranceMinutes),
    },
    {
      accessorKey: "startsAt",
      meta: { label: pricesCopy.table.startsAt },
      header: pricesCopy.table.startsAt,
      cell: ({ row }) => formatPriceDate(row.original.startsAt),
    },
    {
      accessorKey: "endsAt",
      meta: { label: pricesCopy.table.endsAt },
      header: pricesCopy.table.endsAt,
      cell: ({ row }) => formatPriceDate(row.original.endsAt),
    },
    {
      accessorKey: "computedStatus",
      meta: { label: pricesCopy.table.status },
      header: () => <div className="text-center">{pricesCopy.table.status}</div>,
      cell: ({ row }) => {
        const status = row.original.computedStatus

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(status === "active" ? "success" : status === "scheduled" ? "warning" : undefined)}
            >
              {getPriceStatusLabel(status)}
            </Badge>
          </div>
        )
      },
    },
    createActionsColumn<PriceTable>((row) => [
      {
        id: "details",
        label: pricesCopy.actions.details,
        onSelect: () => {
          onOpenDetails?.(row.original)
        },
      },
      ...(canManage
        ? [
          {
            id: "toggle-status" as const,
            label: row.original.status === "active"
              ? pricesCopy.actions.deactivate
              : pricesCopy.actions.activate,
            variant: row.original.status === "active" ? "destructive" as const : "default" as const,
            onSelect: () => {
              onTogglePriceStatus?.(row.original)
            },
          },
        ]
        : []),
    ]),
  ]
}
