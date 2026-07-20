import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"

import { type ReportsBillingRow } from "../model/reports-types"

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function createReportsBillingColumns(options: {
  onOpenDetails?: (row: ReportsBillingRow) => void
} = {}): ColumnDef<ReportsBillingRow>[] {
  return [
    {
      accessorKey: "referenceDate",
      header: "Referência",
      meta: { label: "Referência" },
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onOpenDetails?.(row.original)}>
          {row.original.referenceDate}
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
      accessorKey: "grossRevenue",
      header: "Faturamento bruto",
      meta: { label: "Faturamento bruto" },
      cell: ({ row }) => formatMoney(row.original.grossRevenue),
    },
    {
      accessorKey: "rulesVersionLabel",
      header: "Regras",
      meta: { label: "Regras" },
    },
    {
      accessorKey: "pricesVersionLabel",
      header: "Preços",
      meta: { label: "Preços" },
    },
    createActionsColumn<ReportsBillingRow>([
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
