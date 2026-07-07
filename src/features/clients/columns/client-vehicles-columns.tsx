import { type ColumnDef } from "@tanstack/react-table"
import { CrownIcon } from "lucide-react"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { type ClientVehicleTableRow } from "../types/clients-types"

interface CreateClientVehiclesColumnsOptions {
  onToggleVip?: (vehicle: ClientVehicleTableRow) => void
  vipActionLabel?: string
}

function getClientVehicleDetails(vehicle: ClientVehicleTableRow) {
  return {
    title: vehicle.nom_pessoa,
    description: vehicle.num_cnpj_cpf,
    items: [
      { label: "Código do veículo", value: vehicle.cod_veiculo },
      { label: "Código do cliente", value: vehicle.cod_pessoa },
      { label: "Nome/Razão social", value: vehicle.nom_pessoa },
      { label: "Nome fantasia", value: vehicle.nom_fantasia },
      { label: "Documento", value: vehicle.num_cnpj_cpf },
      { label: "Placa", value: vehicle.num_placa },
      { label: "Veículo", value: vehicle.des_veiculo },
      { label: "Motorista", value: vehicle.nom_motorista },
      { label: "VIP", value: vehicle.vip === "sim" ? "Ativo" : "Inativo" },
    ],
  }
}

export function createClientVehiclesColumns(
  options: CreateClientVehiclesColumnsOptions = {}
): ColumnDef<ClientVehicleTableRow>[] {
  const detailsAction = createDataTableDetailsAction<ClientVehicleTableRow>((row) =>
    getClientVehicleDetails(row.original)
  )

  return [
    {
      accessorKey: "cod_veiculo",
      meta: { label: "Código" },
      header: "Código",
      size: 120,
    },
    {
      accessorKey: "nom_pessoa",
      meta: { label: "Cliente" },
      header: "Cliente",
      size: 220,
      cell: ({ row }) => (
        <DataTableDetails
          {...getClientVehicleDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              <span className="inline-flex items-center gap-1">
                {row.original.nom_pessoa}
                {row.original.vip === "sim" ? (
                  <CrownIcon aria-label="Veículo VIP" className="size-4 text-amber-500" />
                ) : null}
              </span>
            </DataTableDetailsTextTrigger>
          }
        />
      ),
    },
    {
      accessorKey: "num_cnpj_cpf",
      meta: { label: "CNPJ/CPF" },
      header: "CNPJ/CPF",
      size: 160,
    },
    {
      accessorKey: "num_placa",
      meta: { label: "Placa" },
      header: "Placa",
      size: 100,
    },
    {
      accessorKey: "des_veiculo",
      meta: { label: "Veículo" },
      header: "Veículo",
      size: 160,
    },
    {
      accessorKey: "nom_motorista",
      meta: { label: "Motorista" },
      header: "Motorista",
      size: 160,
    },
    {
      accessorKey: "vip",
      meta: { label: "VIP" },
      header: () => <div className="text-center">VIP</div>,
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const isVip = row.original.vip === "sim"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isVip ? "success" : undefined)}
            >
              {isVip ? "Sim" : "Não"}
            </Badge>
          </div>
        )
      },
    },
    createActionsColumn<ClientVehicleTableRow>([
      detailsAction,
      ...(options.onToggleVip
        ? [
          {
            id: "vip" as const,
            label: options.vipActionLabel ?? "Veículo VIP",
            onSelect: (row: { original: ClientVehicleTableRow }) => {
              options.onToggleVip?.(row.original)
            },
          },
        ]
        : []),
    ]),
  ]
}
