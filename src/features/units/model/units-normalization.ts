import { type ErpUnitPayload, type Unit, type UnitYardConfig } from "./units-types"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function readPositiveInteger(value: unknown) {
  const numberValue = readNumber(value)
  return numberValue > 0 ? Math.trunc(numberValue) : null
}

function hasValidUnitIdentity(payload: ErpUnitPayload) {
  return readPositiveInteger(payload.cod_empresa) !== null
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
  return payload.filter(hasValidUnitIdentity).map(sanitizeErpUnitPayload)
}

export function sanitizeParkingSpots(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }
  return Math.trunc(value)
}

export function normalizeUnitYardConfig(config: UnitYardConfig): UnitYardConfig {
  return {
    unitId: config.unitId.trim(),
    patioActive: Boolean(config.patioActive),
    parkingSpots: sanitizeParkingSpots(config.parkingSpots),
    updatedAt: config.updatedAt,
  }
}

export function normalizeUnitYardConfigs(configs: readonly UnitYardConfig[]) {
  return configs.map(normalizeUnitYardConfig).filter((config) => config.unitId.length > 0)
}
