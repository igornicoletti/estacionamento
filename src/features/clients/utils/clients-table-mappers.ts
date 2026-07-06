import {
  type Client,
  type ClientTableRow,
  type ClientVehicle,
  type ClientVehicleTableRow,
  type VipFlag,
} from "../types/clients-types"

function resolveYesNoFlag(value: string) {
  return value.toUpperCase() === "S"
}

export function resolveVipFlag(isEnabled: boolean): VipFlag {
  return isEnabled ? "sim" : "nao"
}

export function resolveClientStatus(client: Client): ClientTableRow["status"] {
  return resolveYesNoFlag(client.ind_pessoa_ativa) ? "ativo" : "inativo"
}

export function mapClientToTableRow(
  client: Client,
  options: { isVipEnabled: boolean }
): ClientTableRow {
  return {
    ...client,
    status: resolveClientStatus(client),
    vip: resolveVipFlag(options.isVipEnabled),
  }
}

export function mapClientVehicleToTableRow(
  vehicle: ClientVehicle,
  options: { isVipEnabled: boolean }
): ClientVehicleTableRow {
  return {
    ...vehicle,
    vip: resolveVipFlag(options.isVipEnabled),
  }
}
