import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { type ClientTableRow, type ClientVehicleTableRow } from "../types/clients-types"
import { clientsCopy } from "../clients-copy"

function mapYesNoToActive(value: string) {
  return value.toUpperCase() === "S" ? clientsCopy.table.active : clientsCopy.table.inactive
}

function formatCityState(city: string, state: string) {
  return [city, state].filter(Boolean).join("/") || "—"
}

export function getClientDetailItems(client: ClientTableRow): readonly AppDetailsSheetItem[] {
  return [
    { label: clientsCopy.table.customerCode, value: client.cod_pessoa },
    { label: clientsCopy.table.legalName, value: client.nom_pessoa },
    { label: clientsCopy.table.tradeName, value: client.nom_fantasia || "—" },
    { label: clientsCopy.table.document, value: client.num_cnpj_cpf },
    { label: clientsCopy.table.email, value: client.des_email_1 || "—" },
    { label: clientsCopy.table.phone, value: client.num_telefone_1 || "—" },
    { label: clientsCopy.table.cityState, value: formatCityState(client.nom_cidade, client.sgl_estado) },
    { label: clientsCopy.table.registrationDate, value: client.dta_cadastro || "—" },
    { label: clientsCopy.table.status, value: mapYesNoToActive(client.ind_pessoa_ativa) },
    { label: clientsCopy.table.financialBlock, value: mapYesNoToActive(client.bloqueio_financeiro) },
    { label: clientsCopy.table.vehicles, value: client.qtd_veiculos },
    { label: clientsCopy.table.lastPurchase, value: client.dta_ultima_compra || "—" },
    { label: clientsCopy.table.vip, value: client.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no },
  ]
}

export function getClientVehicleDetailItems(vehicle: ClientVehicleTableRow): readonly AppDetailsSheetItem[] {
  return [
    { label: clientsCopy.table.vehicleCode, value: vehicle.cod_veiculo },
    { label: clientsCopy.table.customerCode, value: vehicle.cod_pessoa },
    { label: clientsCopy.table.legalName, value: vehicle.nom_pessoa },
    { label: clientsCopy.table.tradeName, value: vehicle.nom_fantasia || "—" },
    { label: clientsCopy.table.document, value: vehicle.num_cnpj_cpf },
    { label: clientsCopy.table.plate, value: vehicle.num_placa },
    { label: clientsCopy.table.vehicle, value: vehicle.des_veiculo || "—" },
    { label: clientsCopy.table.driver, value: vehicle.nom_motorista || "—" },
    { label: clientsCopy.table.vip, value: vehicle.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no },
  ]
}
