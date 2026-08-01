import { formatCpfCnpj, formatPhone, onlyDigits } from "@/lib"

import {
  type ErpClientRow,
  type ErpClientVehicleRow,
} from "../schemas/clients-gateway-schemas"
import { type Client, type ClientVehicle } from "./clients-types"

const brazilianStates = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
])

function normalizeText(value: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? ""
}

function normalizeOptionalText(value: string | null) {
  const normalized = normalizeText(value)
  return normalized || null
}

function normalizeSourceFlag(value: boolean | number | string | null) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value === 1
  }

  const normalized = normalizeText(value).toLocaleUpperCase("pt-BR")

  return ["1", "TRUE", "S", "SIM", "Y", "YES", "ATIVO", "ACTIVE"].includes(
    normalized
  )
}

function normalizeDocument(value: string | null) {
  const normalized = normalizeOptionalText(value)
  return normalized ? formatCpfCnpj(normalized) : null
}

function normalizePhone(value: string | null) {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    return null
  }

  const digits = onlyDigits(normalized)
  return digits.length === 10 || digits.length === 11
    ? formatPhone(digits)
    : normalized
}

function normalizeEmail(value: string | null) {
  const normalized = normalizeOptionalText(value)?.toLocaleLowerCase("pt-BR")

  if (!normalized) {
    return null
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ? normalized
    : null
}

function normalizeState(value: string | null) {
  const state = normalizeText(value).slice(0, 2).toLocaleUpperCase("pt-BR")
  return brazilianStates.has(state) ? state : ""
}

export function mapErpClient(row: ErpClientRow): Client {
  return {
    bloqueio_financeiro: normalizeSourceFlag(row.bloqueio_financeiro),
    cod_pessoa: row.cod_pessoa,
    des_email_1: normalizeEmail(row.des_email_1),
    dta_cadastro: normalizeOptionalText(row.dta_cadastro),
    dta_ultima_compra: normalizeOptionalText(row.dta_ultima_compra),
    ind_pessoa_ativa: normalizeSourceFlag(row.ind_pessoa_ativa),
    nom_cidade: normalizeText(row.nom_cidade),
    nom_fantasia: normalizeText(row.nom_fantasia),
    nom_pessoa: normalizeText(row.nom_pessoa),
    num_cnpj_cpf: normalizeDocument(row.num_cnpj_cpf),
    num_telefone_1: normalizePhone(row.num_telefone_1),
    qtd_veiculos: row.qtd_veiculos,
    sgl_estado: normalizeState(row.sgl_estado),
  }
}

export function mapErpClientVehicle(
  row: ErpClientVehicleRow
): ClientVehicle {
  return {
    cod_pessoa: row.cod_pessoa,
    cod_veiculo: row.cod_veiculo,
    des_veiculo: normalizeText(row.des_veiculo),
    nom_fantasia: normalizeText(row.nom_fantasia),
    nom_motorista: normalizeText(row.nom_motorista),
    nom_pessoa: normalizeText(row.nom_pessoa),
    num_cnpj_cpf: normalizeDocument(row.num_cnpj_cpf),
    num_placa: row.num_placa,
  }
}
