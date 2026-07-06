import { type ErpUnitPayload, type Unit } from "../types/units-types"

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

export function sanitizeErpUnitPayload(payload: ErpUnitPayload): Unit {
  return {
    cod_empresa: sanitizeInteger(payload.cod_empresa),
    nom_razao_social: sanitizeText(payload.nom_razao_social),
    nom_fantasia: sanitizeText(payload.nom_fantasia),
    num_cnpj: sanitizeText(payload.num_cnpj),
    cod_bandeira: sanitizeInteger(payload.cod_bandeira),
    des_bandeira: sanitizeText(payload.des_bandeira),
    cod_cidade: sanitizeInteger(payload.cod_cidade),
    nom_cidade: sanitizeText(payload.nom_cidade),
    nom_estado: sanitizeText(payload.nom_estado),
    sgl_estado: sanitizeStateCode(payload.sgl_estado),
    des_coordenada_empresa: sanitizeText(payload.des_coordenada_empresa),
    ip_rede: sanitizeText(payload.ip_rede),
    nom_banco_dados: sanitizeText(payload.nom_banco_dados),
  }
}

export function sanitizeErpUnitsPayload(payload: readonly ErpUnitPayload[]) {
  return payload.map(sanitizeErpUnitPayload)
}
