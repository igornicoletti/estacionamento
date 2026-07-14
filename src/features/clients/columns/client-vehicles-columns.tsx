import { type ColumnDef } from "@tanstack/react-table"
import { CrownIcon } from "lucide-react"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { clientsCopy } from "../clients-copy"
import { type ClientVehicleTableRow } from "../types/clients-types"

interface CreateClientVehiclesColumnsOptions {
  onOpenDetails: (vehicle: ClientVehicleTableRow) => void
  onToggleVip?: (vehicle: ClientVehicleTableRow) => void
  vipActionLabel?: string
}

export function createClientVehiclesColumns(options: CreateClientVehiclesColumnsOptions): ColumnDef<ClientVehicleTableRow>[] {
  return [
    {
      accessorKey: "cod_veiculo",
      meta: { label: clientsCopy.table.code },
      header: clientsCopy.table.code,
      size: 120,
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
            {row.original.vip === "sim" ? <CrownIcon aria-label="Veículo VIP" className="size-4 text-amber-500" /> : null}
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
      accessorKey: "num_placa",
      meta: { label: clientsCopy.table.plate },
      header: clientsCopy.table.plate,
      size: 100,
    },
    {
      accessorKey: "des_veiculo",
      meta: { label: clientsCopy.table.vehicle },
      header: clientsCopy.table.vehicle,
      size: 160,
    },
    {
      accessorKey: "nom_motorista",
      meta: { label: clientsCopy.table.driver },
      header: clientsCopy.table.driver,
      size: 160,
      cell: ({ row }) => row.original.nom_motorista || "—",
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
    createActionsColumn<ClientVehicleTableRow>([
      {
        id: "details",
        label: "Detalhes",
        onSelect: (row) => options.onOpenDetails(row.original),
      },
      ...(options.onToggleVip ? [{ id: "vip" as const, label: options.vipActionLabel ?? clientsCopy.actions.toggleVehicleVip, onSelect: (row: { original: ClientVehicleTableRow }) => options.onToggleVip?.(row.original) }] : []),
    ]),
  ]
}
