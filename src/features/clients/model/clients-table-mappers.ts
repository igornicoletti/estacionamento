import {
  type Client,
  type ClientStatus,
  type ClientTableRow,
  type ClientVehicle,
  type ClientVehicleTableRow,
  type VipFlag,
} from "./clients-types"

export function resolveClientStatus(client: Client): ClientStatus {
  return client.ind_pessoa_ativa.toLocaleUpperCase("pt-BR") === "S" ? "ativo" : "inativo"
}

export function resolveVipFlag(enabled: boolean): VipFlag {
  return enabled ? "sim" : "nao"
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
