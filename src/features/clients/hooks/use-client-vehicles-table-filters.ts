import * as React from "react"

import { createDataTableFilterOptions, type DataTableFilterField } from "@/components/data-table"

import { clientsCopy } from "../constants/clients-copy"
import { type ClientVehicleTableRow } from "../model"

type ClientVehiclesTableFilterSource = Pick<ClientVehicleTableRow, "num_placa" | "vip">

export function useClientVehiclesTableFilters(vehicles: readonly ClientVehiclesTableFilterSource[]) {
  const plateOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        vehicles,
        (vehicle) => vehicle.num_placa,
        (vehicle) => vehicle.num_placa
      ),
    [vehicles]
  )
  const vipOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        vehicles,
        (vehicle) => vehicle.vip,
        (vehicle) => vehicle.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no
      ),
    [vehicles]
  )

  return [
    { id: "num_placa", title: clientsCopy.filters.plates, options: plateOptions },
    { id: "vip", title: clientsCopy.filters.vip, options: vipOptions },
  ] satisfies readonly DataTableFilterField<ClientVehiclesTableFilterSource>[]
}
