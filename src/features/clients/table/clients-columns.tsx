import { type ColumnDef } from "@tanstack/react-table"
import { CrownIcon } from "lucide-react"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { clientsCopy } from "../constants"
import { type ClientTableRow } from "../model"

interface CreateClientsColumnsOptions {
  onOpenDetails: (client: ClientTableRow) => void
  onSelectVehicles?: (client: ClientTableRow) => void
  onToggleVip?: (client: ClientTableRow) => void
  vipActionLabel?: string
}

function formatCityState(client: ClientTableRow) {
  return [client.nom_cidade, client.sgl_estado]
    .filter(Boolean)
    .join("/") || clientsCopy.shared.emptyValue
}

export function createClientsColumns(
  options: CreateClientsColumnsOptions
): ColumnDef<ClientTableRow>[] {
  return [
    {
      accessorKey: "cod_pessoa",
      header: clientsCopy.table.code,
      meta: { label: clientsCopy.table.code },
      size: 96,
    },
    {
      accessorKey: "nom_pessoa",
      header: clientsCopy.table.client,
      meta: { label: clientsCopy.table.client },
      size: 220,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            options.onOpenDetails(row.original)
          }}
        >
          <span className="inline-flex items-center gap-1">
            {row.original.nom_pessoa}
            {row.original.vip === "sim" ? (
              <CrownIcon
                aria-label={clientsCopy.accessibility.clientVip}
                className="size-4 text-amber-500"
              />
            ) : null}
          </span>
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "nom_fantasia",
      header: clientsCopy.table.tradeName,
      meta: { label: clientsCopy.table.tradeName },
      size: 180,
      cell: ({ row }) => row.original.nom_fantasia || clientsCopy.shared.emptyValue,
    },
    {
      accessorKey: "num_cnpj_cpf",
      header: clientsCopy.table.document,
      meta: { label: clientsCopy.table.document },
      size: 160,
    },
    {
      id: "cidadeUf",
      accessorFn: (client) => formatCityState(client),
      header: clientsCopy.table.cityState,
      meta: { label: clientsCopy.table.cityState },
      size: 120,
      cell: ({ row }) => formatCityState(row.original),
    },
    {
      accessorKey: "status",
      header: clientsCopy.table.status,
      meta: { label: clientsCopy.table.status },
      size: 96,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.status === "ativo"

        return (
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(isActive ? "success" : undefined)}
          >
            {isActive ? clientsCopy.table.active : clientsCopy.table.inactive}
          </Badge>
        )
      },
    },
    {
      accessorKey: "qtd_veiculos",
      header: clientsCopy.table.vehicles,
      meta: { label: clientsCopy.table.vehicles },
      size: 96,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            options.onSelectVehicles?.(row.original)
          }}
        >
          {row.original.qtd_veiculos}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "vip",
      header: clientsCopy.table.vip,
      meta: { label: clientsCopy.table.vip },
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const isVip = row.original.vip === "sim"

        return (
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(isVip ? "success" : undefined)}
          >
            {isVip ? clientsCopy.table.yes : clientsCopy.table.no}
          </Badge>
        )
      },
    },
    createActionsColumn<ClientTableRow>([
      {
        id: "details",
        label: clientsCopy.actions.details,
        onSelect: (row) => {
          options.onOpenDetails(row.original)
        },
      },
      {
        id: "vehicles",
        label: clientsCopy.actions.openVehicles,
        onSelect: (row) => {
          options.onSelectVehicles?.(row.original)
        },
      },
      ...(options.onToggleVip
        ? [
          {
            id: "vip" as const,
            label: options.vipActionLabel ?? clientsCopy.actions.toggleClientVip,
            onSelect: (row: { original: ClientTableRow }) => {
              options.onToggleVip?.(row.original)
            },
          },
        ]
        : []),
    ]),
  ]
}
