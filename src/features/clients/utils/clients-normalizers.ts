import {
  type Client,
  type ClientVehicle,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "../types/clients-types"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value.toUpperCase() === "S"
  }

  return Boolean(value)
}

export function sanitizeErpClientPayload(payload: ErpClientPayload): Client {
  return {
    cod_pessoa: readNumber(payload.cod_pessoa),
    nom_pessoa: readString(payload.nom_pessoa),
    nom_fantasia: readString(payload.nom_fantasia),
    num_cnpj_cpf: readString(payload.num_cnpj_cpf),
    des_email_1: readString(payload.des_email_1),
    num_telefone_1: readString(payload.num_telefone_1),
    nom_cidade: readString(payload.nom_cidade),
    sgl_estado: readString(payload.sgl_estado).toUpperCase(),
    dta_cadastro: readString(payload.dta_cadastro),
    ind_pessoa_ativa: readString(payload.ind_pessoa_ativa),
    bloqueio_financeiro: readString(payload.bloqueio_financeiro),
    qtd_veiculos: readNumber(payload.qtd_veiculos),
    dta_ultima_compra: readString(payload.dta_ultima_compra),
    is_active_120d: readBoolean(payload.is_active_120d),
  }
}

export function sanitizeErpClientsPayload(payload: readonly ErpClientPayload[]) {
  return payload.map(sanitizeErpClientPayload).filter((client) => client.cod_pessoa > 0)
}

export function sanitizeErpClientVehiclePayload(payload: ErpClientVehiclePayload): ClientVehicle {
  return {
    cod_veiculo: readNumber(payload.cod_veiculo),
    cod_pessoa: readNumber(payload.cod_pessoa),
    nom_pessoa: readString(payload.nom_pessoa),
    nom_fantasia: readString(payload.nom_fantasia),
    num_cnpj_cpf: readString(payload.num_cnpj_cpf),
    num_placa: readString(payload.num_placa).toUpperCase(),
    des_veiculo: readString(payload.des_veiculo),
    nom_motorista: readString(payload.nom_motorista),
  }
}

export function sanitizeErpClientVehiclesPayload(payload: readonly ErpClientVehiclePayload[]) {
  return payload.map(sanitizeErpClientVehiclePayload).filter((vehicle) => vehicle.cod_veiculo > 0)
}
