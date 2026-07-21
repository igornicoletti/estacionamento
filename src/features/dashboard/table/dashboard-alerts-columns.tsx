import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

import { type DashboardAlertRow } from "../model/dashboard-types"

export function createDashboardAlertsColumns(options: {
  onOpenDetails?: (row: DashboardAlertRow) => void
} = {}): ColumnDef<DashboardAlertRow>[] {
  return [
    {
      accessorKey: "occurredAt",
      header: "Data/hora",
      meta: { label: "Data/hora" },
      cell: ({ row }) => new Date(row.original.occurredAt).toLocaleString("pt-BR"),
    },
    {
      accessorKey: "title",
      header: "Título",
      meta: { label: "Título" },
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onOpenDetails?.(row.original)}>
          {row.original.title}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "description",
      header: "Descrição",
      meta: { label: "Descrição" },
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
    createActionsColumn<DashboardAlertRow>([
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
