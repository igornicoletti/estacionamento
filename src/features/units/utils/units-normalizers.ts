import { type ErpUnitPayload, type Unit } from "../types/units-types"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export function sanitizeErpUnitPayload(payload: ErpUnitPayload): Unit {
  return {
    cod_empresa: readNumber(payload.cod_empresa),
    nom_razao_social: readString(payload.nom_razao_social),
    nom_fantasia: readString(payload.nom_fantasia),
    num_cnpj: readString(payload.num_cnpj),
    cod_bandeira: readNumber(payload.cod_bandeira),
    des_bandeira: readString(payload.des_bandeira),
    cod_cidade: readNumber(payload.cod_cidade),
    nom_cidade: readString(payload.nom_cidade),
    nom_estado: readString(payload.nom_estado),
    sgl_estado: readString(payload.sgl_estado).toUpperCase(),
    des_coordenada_empresa: readString(payload.des_coordenada_empresa),
    ip_rede: readString(payload.ip_rede),
    nom_banco_dados: readString(payload.nom_banco_dados),
  }
}

export function sanitizeErpUnitsPayload(payload: readonly ErpUnitPayload[]) {
  return payload.map(sanitizeErpUnitPayload).filter((unit) => unit.cod_empresa > 0)
}
