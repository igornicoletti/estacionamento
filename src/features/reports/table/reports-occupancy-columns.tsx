import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

import { type ReportsOccupancyAlertRow } from "../model/reports-types"

export function createReportsOccupancyColumns(options: {
  onOpenDetails?: (row: ReportsOccupancyAlertRow) => void
} = {}): ColumnDef<ReportsOccupancyAlertRow>[] {
  return [
    {
      accessorKey: "occurredAt",
      header: "Data/hora",
      meta: { label: "Data/hora" },
      cell: ({ row }) => new Date(row.original.occurredAt).toLocaleString("pt-BR"),
    },
    {
      accessorKey: "occupancyPercent",
      header: "Ocupação",
      meta: { label: "Ocupação" },
      cell: ({ row }) => `${row.original.occupancyPercent}%`,
    },
    {
      accessorKey: "capacity",
      header: "Capacidade",
      meta: { label: "Capacidade" },
    },
    {
      accessorKey: "availableSpots",
      header: "Vagas livres",
      meta: { label: "Vagas livres" },
    },
    {
      accessorKey: "severity",
      enableSorting: false,
      header: () => <div className="text-center">Severidade</div>,
      meta: { label: "Severidade" },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="outline">
            {row.original.severity === "info"
              ? "Info"
              : row.original.severity === "warning"
                ? "Alerta"
                : "Crítico"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      meta: { label: "Descrição" },
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onOpenDetails?.(row.original)}>
          {row.original.description}
        </DataTableTextAction>
      ),
    },
    createActionsColumn<ReportsOccupancyAlertRow>([
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
