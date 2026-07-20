import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

import { type DashboardVehicleMovementRow } from "../model/dashboard-types"

export function createDashboardMovementsColumns(options: {
  onOpenDetails?: (row: DashboardVehicleMovementRow) => void
} = {}): ColumnDef<DashboardVehicleMovementRow>[] {
  return [
    {
      accessorKey: "capturedAt",
      header: "Data/hora",
      meta: { label: "Data/hora" },
      cell: ({ row }) => new Date(row.original.capturedAt).toLocaleString("pt-BR"),
    },
    {
      accessorKey: "plate",
      header: "Placa",
      meta: { label: "Placa" },
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onOpenDetails?.(row.original)}>
          {row.original.plate}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "cameraType",
      header: "Tipo",
      meta: { label: "Tipo" },
    },
    {
      accessorKey: "cameraName",
      header: "Câmera",
      meta: { label: "Câmera" },
    },
    {
      accessorKey: "confidence",
      header: "Confiança",
      meta: { label: "Confiança" },
      cell: ({ row }) => `${row.original.confidence.toFixed(1)}%`,
    },
    {
      accessorKey: "stayMinutes",
      header: "Permanência",
      meta: { label: "Permanência" },
      cell: ({ row }) => (row.original.stayMinutes ? `${row.original.stayMinutes} min` : "—"),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      meta: { label: "Status" },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="outline">
            {row.original.status === "no_patio"
              ? "No pátio"
              : row.original.status === "fora_do_patio"
                ? "Saída confirmada"
                : "No pátio (alerta)"}
          </Badge>
        </div>
      ),
    },
    createActionsColumn<DashboardVehicleMovementRow>([
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
