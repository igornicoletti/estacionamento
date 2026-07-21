import { type ColumnDef, type Row } from "@tanstack/react-table"
import { CrownIcon } from "lucide-react"

import { createActionsColumn, DataTableSensitiveValue, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENT_SUCCESS_BADGE_TONE } from "../constants/clients-ui"
import { type ClientVehicleTableRow } from "../model"

interface CreateClientVehiclesColumnsOptions {
  onOpenDetails: (vehicle: ClientVehicleTableRow) => void
  onToggleVip?: (vehicle: ClientVehicleTableRow) => void
  pendingVipVehicleId?: number | null
}

export function createClientVehiclesColumns(
  options: CreateClientVehiclesColumnsOptions
): ColumnDef<ClientVehicleTableRow>[] {
  return [
    {
      accessorKey: "cod_veiculo",
      header: clientsCopy.table.code,
      meta: { label: clientsCopy.table.code },
      size: 120,
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
                aria-label={clientsCopy.accessibility.vehicleVip}
                className="size-4 text-amber-500"
              />
            ) : null}
          </span>
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "num_cnpj_cpf",
      header: clientsCopy.table.document,
      meta: { label: clientsCopy.table.document },
      size: 160,
      cell: ({ row }) => (
        <DataTableSensitiveValue value={row.original.num_cnpj_cpf} kind="cpfCnpj" />
      ),
    },
    {
      accessorKey: "num_placa",
      header: clientsCopy.table.plate,
      meta: { label: clientsCopy.table.plate },
      size: 100,
    },
    {
      accessorKey: "des_veiculo",
      header: clientsCopy.table.vehicle,
      meta: { label: clientsCopy.table.vehicle },
      size: 160,
    },
    {
      accessorKey: "nom_motorista",
      header: clientsCopy.table.driver,
      meta: { label: clientsCopy.table.driver },
      size: 160,
      cell: ({ row }) => row.original.nom_motorista || clientsCopy.shared.emptyValue,
    },
    {
      accessorKey: "vip",
      header: () => <div className="text-center font-medium">{clientsCopy.table.vip}</div>,
      meta: { label: clientsCopy.table.vip },
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const isVip = row.original.vip === "sim"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isVip ? CLIENT_SUCCESS_BADGE_TONE : undefined)}
            >
              {isVip ? clientsCopy.table.yes : clientsCopy.table.no}
            </Badge>
          </div>
        )
      },
    },
    createActionsColumn<ClientVehicleTableRow>((row) => {
      const isPendingVip = options.pendingVipVehicleId === row.original.cod_veiculo
      const isVip = row.original.vip === "sim"

      return [
        {
          id: "details",
          label: clientsCopy.actions.details,
          onSelect: (selectedRow) => {
            options.onOpenDetails(selectedRow.original)
          },
        },
        ...(options.onToggleVip
          ? [
            {
              id: "vip" as const,
              label: isPendingVip
                ? clientsCopy.actions.updating
                : isVip
                  ? clientsCopy.actions.removeVehicleVip
                  : clientsCopy.actions.addVehicleVip,
              disabled: isPendingVip,
              onSelect: (selectedRow: Row<ClientVehicleTableRow>) => {
                options.onToggleVip?.(selectedRow.original)
              },
            },
          ]
          : []),
      ]
    }),
  ]
}
