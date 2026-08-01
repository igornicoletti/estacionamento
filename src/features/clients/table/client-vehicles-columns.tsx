import { type ColumnDef } from "@tanstack/react-table"

import {
  createActionsColumn,
  DataTableSensitiveValue,
  DataTableTextAction,
} from "@/components/data-table"
import { clientsCopy } from "../constants/clients-copy"
import { type ClientVehicleTableRow } from "../model/clients-types"

interface CreateClientVehiclesColumnsOptions {
  onOpenDetails: (vehicle: ClientVehicleTableRow) => void
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
          {row.original.nom_pessoa}
        </DataTableTextAction>
      ),
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
      cell: ({ row }) =>
        row.original.nom_motorista || clientsCopy.shared.emptyValue,
    },
    createActionsColumn<ClientVehicleTableRow>([
      {
        id: "details",
        label: clientsCopy.actions.details,
        onSelect: (selectedRow) => {
          options.onOpenDetails(selectedRow.original)
        },
      },
    ]),
  ]
}
