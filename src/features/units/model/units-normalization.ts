import { formatCnpj, formatHumanReadableText } from "@/lib"

import {
  type ErpUnitRow,
  type UnitYardConfigRow,
} from "../schemas/units-gateway-schemas"
import { type Unit, type UnitYardConfig } from "./units-types"

function normalizeText(value: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? ""
}

function normalizeCnpj(value: string | null) {
  const normalized = normalizeText(value)
  return normalized ? formatCnpj(normalized) : ""
}

export function mapErpUnit(row: ErpUnitRow): Unit {
  return {
    cod_empresa: row.cod_empresa,
    nom_razao_social: formatHumanReadableText(row.nom_razao_social),
    nom_fantasia: formatHumanReadableText(row.nom_fantasia),
    num_cnpj: normalizeCnpj(row.num_cnpj),
    cod_bandeira: row.cod_bandeira,
    des_bandeira: formatHumanReadableText(row.des_bandeira),
    cod_cidade: row.cod_cidade,
    nom_cidade: formatHumanReadableText(row.nom_cidade),
    nom_estado: formatHumanReadableText(row.nom_estado),
    sgl_estado: normalizeText(row.sgl_estado).toLocaleUpperCase("pt-BR"),
    des_coordenada_empresa: normalizeText(row.des_coordenada_empresa),
    ip_rede: normalizeText(row.ip_rede),
    nom_banco_dados: normalizeText(row.nom_banco_dados),
  }
}

export function mapUnitYardConfig(
  row: UnitYardConfigRow
): UnitYardConfig {
  return {
    unitId: String(row.unit_id),
    patioActive: row.patio_active,
    parkingSpots: row.parking_spots,
    updatedAt: row.updated_at,
  }
}
