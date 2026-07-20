import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"

import { type DashboardBillingRow } from "../model/dashboard-types"

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function createDashboardBillingColumns(options: {
  onOpenDetails?: (row: DashboardBillingRow) => void
} = {}): ColumnDef<DashboardBillingRow>[] {
  return [
    {
      accessorKey: "period",
      header: "Período",
      meta: { label: "Período" },
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onOpenDetails?.(row.original)}>
          {row.original.period}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "vehiclesCharged",
      header: "Veículos cobrados",
      meta: { label: "Veículos cobrados" },
    },
    {
      accessorKey: "averageTicket",
      header: "Ticket médio",
      meta: { label: "Ticket médio" },
      cell: ({ row }) => formatMoney(row.original.averageTicket),
    },
    {
      accessorKey: "occupancyPeakPercent",
      header: "Pico de ocupação",
      meta: { label: "Pico de ocupação" },
      cell: ({ row }) => `${row.original.occupancyPeakPercent}%`,
    },
    {
      accessorKey: "grossRevenue",
      header: "Faturamento bruto",
      meta: { label: "Faturamento bruto" },
      cell: ({ row }) => formatMoney(row.original.grossRevenue),
    },
    createActionsColumn<DashboardBillingRow>([
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
