import * as React from "react"

import {
  createDataTableFilterOptions,
  type DataTableFilterField,
} from "@/components/data-table"

import { clientsCopy } from "../constants/clients-copy"
import { type ClientVehicleTableRow } from "../model/clients-types"

type ClientVehiclesTableFilterSource = Pick<
  ClientVehicleTableRow,
  "num_placa"
>

export function useClientVehiclesTableFilters(
  vehicles: readonly ClientVehiclesTableFilterSource[]
) {
  const plateOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        vehicles,
        (vehicle) => vehicle.num_placa,
        (vehicle) => vehicle.num_placa
      ),
    [vehicles]
  )

  return [
    {
      id: "num_placa",
      title: clientsCopy.filters.plates,
      options: plateOptions,
    },
  ] satisfies readonly DataTableFilterField<ClientVehiclesTableFilterSource>[]
}
