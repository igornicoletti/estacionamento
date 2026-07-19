import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { clientsCopy } from "../constants"
import { type ClientTableRow, type ClientVehicleTableRow } from "./clients-types"

function emptyFallback(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? clientsCopy.shared.emptyValue : value
}

function mapYesNoToStatus(value: string) {
  return value.toLocaleUpperCase("pt-BR") === "S"
    ? clientsCopy.table.active
    : clientsCopy.table.inactive
}

function formatCityState(city: string, state: string) {
  return [city, state].filter(Boolean).join("/") || clientsCopy.shared.emptyValue
}

export function getClientDetailItems(client: ClientTableRow): readonly AppDetailsSheetItem[] {
  return [
    { label: clientsCopy.table.customerCode, value: client.cod_pessoa },
    { label: clientsCopy.table.legalName, value: emptyFallback(client.nom_pessoa) },
    { label: clientsCopy.table.tradeName, value: emptyFallback(client.nom_fantasia) },
    { label: clientsCopy.table.document, value: emptyFallback(client.num_cnpj_cpf) },
    { label: clientsCopy.table.email, value: emptyFallback(client.des_email_1) },
    { label: clientsCopy.table.phone, value: emptyFallback(client.num_telefone_1) },
    { label: clientsCopy.table.cityState, value: formatCityState(client.nom_cidade, client.sgl_estado) },
    { label: clientsCopy.table.registrationDate, value: emptyFallback(client.dta_cadastro) },
    { label: clientsCopy.table.status, value: mapYesNoToStatus(client.ind_pessoa_ativa) },
    { label: clientsCopy.table.financialBlock, value: mapYesNoToStatus(client.bloqueio_financeiro) },
    { label: clientsCopy.table.vehicles, value: client.qtd_veiculos },
    { label: clientsCopy.table.lastPurchase, value: emptyFallback(client.dta_ultima_compra) },
    { label: clientsCopy.table.vip, value: client.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no },
  ]
}

export function getClientVehicleDetailItems(
  vehicle: ClientVehicleTableRow
): readonly AppDetailsSheetItem[] {
  return [
    { label: clientsCopy.table.vehicleCode, value: vehicle.cod_veiculo },
    { label: clientsCopy.table.customerCode, value: vehicle.cod_pessoa },
    { label: clientsCopy.table.legalName, value: emptyFallback(vehicle.nom_pessoa) },
    { label: clientsCopy.table.tradeName, value: emptyFallback(vehicle.nom_fantasia) },
    { label: clientsCopy.table.document, value: emptyFallback(vehicle.num_cnpj_cpf) },
    { label: clientsCopy.table.plate, value: emptyFallback(vehicle.num_placa) },
    { label: clientsCopy.table.vehicle, value: emptyFallback(vehicle.des_veiculo) },
    { label: clientsCopy.table.driver, value: emptyFallback(vehicle.nom_motorista) },
    { label: clientsCopy.table.vip, value: vehicle.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no },
  ]
}
