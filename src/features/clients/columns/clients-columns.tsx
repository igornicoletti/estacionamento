import { type ColumnDef } from "@tanstack/react-table"
import { CrownIcon } from "lucide-react"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { clientsCopy } from "../clients-copy"
import { type ClientTableRow } from "../types/clients-types"

interface CreateClientsColumnsOptions {
  onOpenDetails: (client: ClientTableRow) => void
  onSelectVehicles?: (client: ClientTableRow) => void
  onToggleVip?: (client: ClientTableRow) => void
  vipActionLabel?: string
}

function formatCityState(client: ClientTableRow) {
  return [client.nom_cidade, client.sgl_estado].filter(Boolean).join("/") || "—"
}

export function createClientsColumns(options: CreateClientsColumnsOptions): ColumnDef<ClientTableRow>[] {
  return [
    {
      accessorKey: "cod_pessoa",
      meta: { label: clientsCopy.table.code },
      header: clientsCopy.table.code,
      size: 96,
    },
    {
      accessorKey: "nom_pessoa",
      meta: { label: clientsCopy.table.client },
      header: clientsCopy.table.client,
      size: 220,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => options.onOpenDetails(row.original)}
        >
          <span className="inline-flex items-center gap-1">
            {row.original.nom_pessoa}
            {row.original.vip === "sim" ? <CrownIcon aria-label={clientsCopy.accessibility.clientVip} className="size-4 text-amber-500" /> : null}
          </span>
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "num_cnpj_cpf",
      meta: { label: clientsCopy.table.document },
      header: clientsCopy.table.document,
      size: 160,
    },
    {
      id: "cidadeUf",
      accessorFn: (client) => formatCityState(client),
      meta: { label: clientsCopy.table.cityState },
      header: clientsCopy.table.cityState,
      size: 120,
      cell: ({ row }) => formatCityState(row.original),
    },
    {
      accessorKey: "status",
      meta: { label: clientsCopy.table.status },
      header: () => <div className="text-center">{clientsCopy.table.status}</div>,
      size: 96,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.status === "ativo"

        return (
          <div className="flex justify-center">
            <Badge variant="secondary" className={getBadgeToneClassName(isActive ? "success" : undefined)}>
              {isActive ? clientsCopy.table.active : clientsCopy.table.inactive}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "qtd_veiculos",
      meta: { label: clientsCopy.table.vehicles },
      header: clientsCopy.table.vehicles,
      size: 96,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => options.onSelectVehicles?.(row.original)}
        >
          {row.original.qtd_veiculos}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "vip",
      meta: { label: clientsCopy.table.vip },
      header: () => <div className="text-center">{clientsCopy.table.vip}</div>,
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const isVip = row.original.vip === "sim"

        return (
          <div className="flex justify-center">
            <Badge variant="secondary" className={getBadgeToneClassName(isVip ? "success" : undefined)}>
              {isVip ? clientsCopy.table.yes : clientsCopy.table.no}
            </Badge>
          </div>
        )
      },
    },
    createActionsColumn<ClientTableRow>([
      {
        id: "details",
        label: clientsCopy.actions.details,
        onSelect: (row) => options.onOpenDetails(row.original),
      },
      {
        id: "vehicles",
        label: clientsCopy.actions.openVehicles,
        onSelect: (row) => options.onSelectVehicles?.(row.original),
      },
      ...(options.onToggleVip ? [{ id: "vip" as const, label: options.vipActionLabel ?? clientsCopy.actions.toggleClientVip, onSelect: (row: { original: ClientTableRow }) => options.onToggleVip?.(row.original) }] : []),
    ]),
  ]
}
