import {
  type Client,
  type ClientVehicle,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "../types/clients-types"

function sanitizeText(value: unknown) {
  if (typeof value === "string") {
    return value.trim().replace(/\s+/g, " ")
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return ""
}

function sanitizeInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === "string") {
    const normalized = Number(value.trim())

    return Number.isFinite(normalized) ? Math.trunc(normalized) : 0
  }

  return 0
}

function sanitizeStateCode(value: unknown) {
  return sanitizeText(value).slice(0, 2).toUpperCase()
}

function sanitizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()

    if (normalized === "true" || normalized === "t" || normalized === "1" || normalized === "s") {
      return true
    }

    if (normalized === "false" || normalized === "f" || normalized === "0" || normalized === "n") {
      return false
    }
  }

  if (typeof value === "number") {
    return value === 1
  }

  return false
}

export function sanitizeErpClientPayload(payload: ErpClientPayload): Client {
  return {
    cod_pessoa: sanitizeInteger(payload.cod_pessoa),
    nom_pessoa: sanitizeText(payload.nom_pessoa),
    nom_fantasia: sanitizeText(payload.nom_fantasia),
    num_cnpj_cpf: sanitizeText(payload.num_cnpj_cpf),
    des_email_1: sanitizeText(payload.des_email_1),
    num_telefone_1: sanitizeText(payload.num_telefone_1),
    nom_cidade: sanitizeText(payload.nom_cidade),
    sgl_estado: sanitizeStateCode(payload.sgl_estado),
    dta_cadastro: sanitizeText(payload.dta_cadastro),
    ind_pessoa_ativa: sanitizeText(payload.ind_pessoa_ativa),
    bloqueio_financeiro: sanitizeText(payload.bloqueio_financeiro),
    qtd_veiculos: sanitizeInteger(payload.qtd_veiculos),
    dta_ultima_compra: sanitizeText(payload.dta_ultima_compra),
    is_active_120d: sanitizeBoolean(payload.is_active_120d),
  }
}

export function sanitizeErpClientsPayload(payload: readonly ErpClientPayload[]) {
  return payload.map(sanitizeErpClientPayload)
}

export function sanitizeErpClientVehiclePayload(
  payload: ErpClientVehiclePayload
): ClientVehicle {
  return {
    cod_veiculo: sanitizeInteger(payload.cod_veiculo),
    cod_pessoa: sanitizeInteger(payload.cod_pessoa),
    nom_pessoa: sanitizeText(payload.nom_pessoa),
    nom_fantasia: sanitizeText(payload.nom_fantasia),
    num_cnpj_cpf: sanitizeText(payload.num_cnpj_cpf),
    num_placa: sanitizeText(payload.num_placa),
    des_veiculo: sanitizeText(payload.des_veiculo),
    nom_motorista: sanitizeText(payload.nom_motorista),
  }
}

export function sanitizeErpClientVehiclesPayload(
  payload: readonly ErpClientVehiclePayload[]
) {
  return payload.map(sanitizeErpClientVehiclePayload)
}
