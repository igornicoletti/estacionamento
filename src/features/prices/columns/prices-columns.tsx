import { type ColumnDef } from "@tanstack/react-table"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { type PriceTable } from "../types/prices-types"
import {
  formatPriceCharge,
  formatPriceDate,
  formatPriceDateTime,
  formatPriceHours,
  formatPriceMinutes,
  formatPriceMoney,
  getPriceComputedStatus,
  getPriceScopeLabel,
  getPriceStatusLabel,
  getPriceUnitLabel,
} from "../utils/prices-models"

function getPriceDetails(price: PriceTable) {
  const status = getPriceComputedStatus(price)
  const tiers = price.tiers.length > 0
    ? price.tiers
      .map((tier) => `Até ${formatPriceHours(tier.limitHours)}: ${formatPriceMoney(tier.amount)}`)
      .join(" | ")
    : "Sem faixas adicionais"

  return {
    title: getPriceUnitLabel(price),
    description: "Tabela de preço de estacionamento.",
    items: [
      { label: "Escopo", value: getPriceScopeLabel(price) },
      { label: "Unidade", value: getPriceUnitLabel(price) },
      { label: "Cobrança", value: formatPriceCharge(price) },
      { label: "Ciclo", value: formatPriceHours(price.cycleHours) },
      { label: "Carência", value: formatPriceMinutes(price.graceMinutes) },
      { label: "Tolerância", value: formatPriceMinutes(price.toleranceMinutes) },
      { label: "Início", value: formatPriceDate(price.startsAt) },
      { label: "Fim", value: formatPriceDate(price.endsAt) },
      { label: "Status", value: getPriceStatusLabel(status) },
      { label: "Versão", value: String(price.version) },
      { label: "Faixas", value: tiers },
      { label: "Justificativa", value: price.reason },
      { label: "Observação", value: price.notes },
      { label: "Atualizado em", value: formatPriceDateTime(price.updatedAt) },
    ],
  }
}

export function createPricesColumns(): ColumnDef<PriceTable>[] {
  const detailsAction = createDataTableDetailsAction<PriceTable>((row) =>
    getPriceDetails(row.original)
  )

  return [
    {
      accessorKey: "scope",
      meta: { label: "Escopo" },
      header: "Escopo",
      cell: ({ row }) => (
        <Badge variant="secondary" className={getBadgeToneClassName(row.original.scope === "network" ? "info" : undefined)}>
          {getPriceScopeLabel(row.original)}
        </Badge>
      ),
    },
    {
      accessorKey: "unitName",
      meta: { label: "Unidade" },
      header: "Unidade",
      cell: ({ row }) => (
        <DataTableDetails
          {...getPriceDetails(row.original)}
          trigger={(
            <DataTableDetailsTextTrigger>
              {getPriceUnitLabel(row.original)}
            </DataTableDetailsTextTrigger>
          )}
        />
      ),
    },
    {
      id: "charge",
      accessorFn: (price) => formatPriceCharge(price),
      meta: { label: "Cobrança" },
      header: "Cobrança",
      cell: ({ row }) => (
        <span className="block max-w-80 truncate tabular-nums">
          {formatPriceCharge(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "cycleHours",
      meta: { label: "Ciclo" },
      header: "Ciclo",
      cell: ({ row }) => formatPriceHours(row.original.cycleHours),
    },
    {
      accessorKey: "graceMinutes",
      meta: { label: "Carência" },
      header: "Carência",
      cell: ({ row }) => formatPriceMinutes(row.original.graceMinutes),
    },
    {
      accessorKey: "toleranceMinutes",
      meta: { label: "Tolerância" },
      header: "Tolerância",
      cell: ({ row }) => formatPriceMinutes(row.original.toleranceMinutes),
    },
    {
      accessorKey: "startsAt",
      meta: { label: "Início" },
      header: "Início",
      cell: ({ row }) => formatPriceDate(row.original.startsAt),
    },
    {
      accessorKey: "endsAt",
      meta: { label: "Fim" },
      header: "Fim",
      cell: ({ row }) => formatPriceDate(row.original.endsAt),
    },
    {
      accessorKey: "computedStatus",
      meta: { label: "Status" },
      header: () => <div className="text-center">Status</div>,
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
    createActionsColumn<PriceTable>([detailsAction]),
  ]
}
