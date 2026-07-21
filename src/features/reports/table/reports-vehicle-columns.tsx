import { type ColumnDef } from "@tanstack/react-table"

import {
  createActionsColumn,
  DataTableTextAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
  formatParkingCameraType,
  formatParkingMovementStatus,
} from "@/features/operations/model/parking-movement-formatters"

import { type ReportsVehicleMovementRow } from "../model/reports-types"

export function createReportsVehicleColumns(
  options: {
    onOpenDetails?: (row: ReportsVehicleMovementRow) => void
  } = {},
): ColumnDef<ReportsVehicleMovementRow>[] {
  return [
    {
      accessorKey: "capturedAt",
      header: "Data/hora",
      meta: { label: "Data/hora" },
      cell: ({ row }) =>
        new Date(row.original.capturedAt).toLocaleString("pt-BR"),
    },
    {
      accessorKey: "plate",
      header: "Placa",
      meta: { label: "Placa" },
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => options.onOpenDetails?.(row.original)}
        >
          {row.original.plate}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "cameraType",
      header: "Tipo",
      meta: {
        label: "Tipo",
        exportValue: (_value, row) => formatParkingCameraType(row.cameraType),
      },
      cell: ({ row }) => formatParkingCameraType(row.original.cameraType),
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
      cell: ({ row }) =>
        row.original.stayMinutes ? `${row.original.stayMinutes} min` : "—",
    },
    {
      accessorKey: "status",
      enableSorting: false,
      header: () => <div className="text-center">Status</div>,
      meta: {
        label: "Status",
        exportValue: (_value, row) => formatParkingMovementStatus(row.status),
      },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="outline">
            {formatParkingMovementStatus(row.original.status)}
          </Badge>
        </div>
      ),
    },
    createActionsColumn<ReportsVehicleMovementRow>([
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
