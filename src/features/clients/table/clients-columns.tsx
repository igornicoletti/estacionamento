import { type ColumnDef, type Row } from "@tanstack/react-table"
import { CrownIcon } from "lucide-react"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENT_SUCCESS_BADGE_TONE } from "../constants/clients-ui"
import { type ClientTableRow } from "../model"

interface CreateClientsColumnsOptions {
  onOpenDetails: (client: ClientTableRow) => void
  onSelectVehicles?: (client: ClientTableRow) => void
  onToggleVip?: (client: ClientTableRow) => void
  pendingVipClientId?: number | null
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
      accessorKey: "des_email_1",
      header: clientsCopy.table.email,
      meta: { label: clientsCopy.table.email },
      size: 180,
      cell: ({ row }) => row.original.des_email_1 || clientsCopy.shared.emptyValue,
    },
    {
      accessorKey: "num_telefone_1",
      header: clientsCopy.table.phone,
      meta: { label: clientsCopy.table.phone },
      size: 140,
      cell: ({ row }) => row.original.num_telefone_1 || clientsCopy.shared.emptyValue,
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
            className={getBadgeToneClassName(isActive ? CLIENT_SUCCESS_BADGE_TONE : undefined)}
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
      cell: ({ row }) => {
        if (!options.onSelectVehicles || row.original.qtd_veiculos === 0) {
          return row.original.qtd_veiculos === 0
            ? clientsCopy.shared.emptyValue
            : row.original.qtd_veiculos
        }

        return (
          <DataTableTextAction
            onClick={() => {
              options.onSelectVehicles?.(row.original)
            }}
          >
            {row.original.qtd_veiculos}
          </DataTableTextAction>
        )
      },
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
            className={getBadgeToneClassName(isVip ? CLIENT_SUCCESS_BADGE_TONE : undefined)}
          >
            {isVip ? clientsCopy.table.yes : clientsCopy.table.no}
          </Badge>
        )
      },
    },
    createActionsColumn<ClientTableRow>((row) => {
      const isPendingVip = options.pendingVipClientId === row.original.cod_pessoa

      return [
        {
          id: "details",
          label: clientsCopy.actions.details,
          disabled: isPendingVip,
          onSelect: (selectedRow) => {
            options.onOpenDetails(selectedRow.original)
          },
        },
        ...(options.onSelectVehicles && row.original.qtd_veiculos > 0
          ? [
            {
              id: "vehicles" as const,
              label: clientsCopy.actions.openVehicles,
              disabled: isPendingVip,
              onSelect: (selectedRow: Row<ClientTableRow>) => {
                options.onSelectVehicles?.(selectedRow.original)
              },
            },
          ]
          : []),
        ...(options.onToggleVip
          ? [
            {
              id: "vip" as const,
              label: isPendingVip
                ? clientsCopy.actions.updating
                : options.vipActionLabel ?? clientsCopy.actions.toggleClientVip,
              disabled: isPendingVip,
              onSelect: (selectedRow: Row<ClientTableRow>) => {
                options.onToggleVip?.(selectedRow.original)
              },
            },
          ]
          : []),
      ]
    }),
  ]
}
