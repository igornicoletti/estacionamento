import { type ColumnDef } from "@tanstack/react-table"

import {
  createActionsColumn,
  DataTableSensitiveValue,
  DataTableTextAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { clientsCopy } from "../constants/clients-copy"
import { formatClientCityState } from "../model/clients-formatters"
import { type ClientTableRow } from "../model/clients-types"

interface CreateClientsColumnsOptions {
  onOpenDetails: (client: ClientTableRow) => void
  onSelectVehicles?: (client: ClientTableRow) => void
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
          {row.original.nom_pessoa}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "nom_fantasia",
      header: clientsCopy.table.tradeName,
      meta: { label: clientsCopy.table.tradeName },
      size: 180,
      cell: ({ row }) =>
        row.original.nom_fantasia || clientsCopy.shared.emptyValue,
    },
    {
      accessorKey: "num_cnpj_cpf",
      header: clientsCopy.table.document,
      meta: { label: clientsCopy.table.document },
      size: 160,
      cell: ({ row }) => (
        <DataTableSensitiveValue
          value={row.original.num_cnpj_cpf ?? ""}
          kind="cpfCnpj"
          fallback={clientsCopy.shared.emptyValue}
        />
      ),
    },
    {
      accessorKey: "des_email_1",
      header: clientsCopy.table.email,
      meta: { label: clientsCopy.table.email },
      size: 180,
      cell: ({ row }) =>
        row.original.des_email_1 || clientsCopy.shared.emptyValue,
    },
    {
      accessorKey: "num_telefone_1",
      header: clientsCopy.table.phone,
      meta: { label: clientsCopy.table.phone },
      size: 140,
      cell: ({ row }) => (
        <DataTableSensitiveValue
          value={row.original.num_telefone_1 ?? ""}
          kind="phone"
          fallback={clientsCopy.shared.emptyValue}
        />
      ),
    },
    {
      id: "cidadeUf",
      accessorFn: (client) =>
        formatClientCityState(client, clientsCopy.shared.emptyValue),
      header: clientsCopy.table.cityState,
      meta: { label: clientsCopy.table.cityState },
      size: 120,
      cell: ({ row }) =>
        formatClientCityState(
          row.original,
          clientsCopy.shared.emptyValue
        ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className="text-center font-medium">
          {clientsCopy.table.status}
        </div>
      ),
      meta: { label: clientsCopy.table.status },
      size: 96,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.status === "ativo"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
            >
              {isActive ? clientsCopy.table.active : clientsCopy.table.inactive}
            </Badge>
          </div>
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
    createActionsColumn<ClientTableRow>((row) => {
      return [
        {
          id: "details",
          label: clientsCopy.actions.details,
          onSelect: () => {
            options.onOpenDetails(row.original)
          },
        },
        ...(options.onSelectVehicles && row.original.qtd_veiculos > 0
          ? [
            {
              id: "vehicles" as const,
              label: clientsCopy.actions.openVehicles,
              onSelect: () => {
                options.onSelectVehicles?.(row.original)
              },
            },
          ]
          : []),
      ]
    }),
  ]
}
