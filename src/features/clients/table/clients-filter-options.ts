import { createDataTableFilterOptions } from "@/components/data-table"

import { clientsCopy } from "../constants"
import { type ClientTableRow, type ClientVehicleTableRow } from "../model"

export function createClientStatusFilterOptions(records: readonly ClientTableRow[]) {
  return createDataTableFilterOptions(
    records,
    (client) => client.status,
    (client) => client.status === "ativo" ? clientsCopy.table.active : clientsCopy.table.inactive
  )
}

export function createClientVipFilterOptions(records: readonly ClientTableRow[]) {
  return createDataTableFilterOptions(
    records,
    (client) => client.vip,
    (client) => client.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no
  )
}

export function createVehiclePlateFilterOptions(records: readonly ClientVehicleTableRow[]) {
  return createDataTableFilterOptions(
    records,
    (vehicle) => vehicle.num_placa,
    (vehicle) => vehicle.num_placa
  )
}

export function createVehicleVipFilterOptions(records: readonly ClientVehicleTableRow[]) {
  return createDataTableFilterOptions(
    records,
    (vehicle) => vehicle.vip,
    (vehicle) => vehicle.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no
  )
}
