import {
  type Client,
  type ClientVehicle,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "./clients-types"
import { readBoolean, readNumber, readString } from "./clients-parsers"

const brazilianStates = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
])

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value)
}

function isValidCpf(value: string) {
  const digits = onlyDigits(value)

  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
    return false
  }

  const calculate = (length: number) => {
    const sum = digits
      .slice(0, length)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return calculate(9) === Number(digits[9]) && calculate(10) === Number(digits[10])
}

function isValidCnpj(value: string) {
  const digits = onlyDigits(value)

  if (digits.length !== 14 || hasRepeatedDigits(digits)) {
    return false
  }

  const calculate = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = digits
      .slice(0, length)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * weights[index], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  return calculate(12) === Number(digits[12]) && calculate(13) === Number(digits[13])
}

export function normalizeCpfCnpj(value: unknown) {
  const digits = onlyDigits(readString(value))

  if (digits.length === 11) {
    return isValidCpf(digits)
      ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : digits
  }

  if (digits.length === 14) {
    return isValidCnpj(digits)
      ? digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      : digits
  }

  return readString(value)
}

export function normalizePhoneBr(value: unknown) {
  const digits = onlyDigits(readString(value))

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    return digits.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, "+$1 ($2) $3-$4")
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return digits.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")
  }

  return readString(value)
}

export function normalizeEmail(value: unknown) {
  const email = readString(value).toLocaleLowerCase("pt-BR")

  if (!email) {
    return ""
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ""
}

export function normalizeUf(value: unknown) {
  const uf = readString(value).slice(0, 2).toLocaleUpperCase("pt-BR")
  return brazilianStates.has(uf) ? uf : ""
}

export function normalizePlate(value: unknown) {
  const plate = readString(value).replace(/[^a-zA-Z0-9]/g, "").toLocaleUpperCase("pt-BR")

  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate) || /^[A-Z]{3}\d{4}$/.test(plate)) {
    return plate
  }

  return plate
}

export function normalizeYesNoSourceFlag(value: unknown) {
  return readBoolean(value) ? "S" : "N"
}

export function sanitizeErpClientPayload(payload: ErpClientPayload): Client {
  return {
    bloqueio_financeiro: normalizeYesNoSourceFlag(payload.bloqueio_financeiro),
    cod_pessoa: readNumber(payload.cod_pessoa),
    des_email_1: normalizeEmail(payload.des_email_1),
    dta_cadastro: readString(payload.dta_cadastro),
    dta_ultima_compra: readString(payload.dta_ultima_compra),
    ind_pessoa_ativa: normalizeYesNoSourceFlag(payload.ind_pessoa_ativa),
    is_active_120d: readBoolean(payload.is_active_120d),
    nom_cidade: readString(payload.nom_cidade),
    nom_fantasia: readString(payload.nom_fantasia),
    nom_pessoa: readString(payload.nom_pessoa),
    num_cnpj_cpf: normalizeCpfCnpj(payload.num_cnpj_cpf),
    num_telefone_1: normalizePhoneBr(payload.num_telefone_1),
    qtd_veiculos: Math.max(0, readNumber(payload.qtd_veiculos)),
    sgl_estado: normalizeUf(payload.sgl_estado),
  }
}

export function sanitizeErpClientsPayload(payload: readonly ErpClientPayload[]) {
  return payload
    .map(sanitizeErpClientPayload)
    .filter((client) => client.cod_pessoa > 0 && client.nom_pessoa.length > 0)
}

export function sanitizeErpClientVehiclePayload(payload: ErpClientVehiclePayload): ClientVehicle {
  return {
    cod_pessoa: readNumber(payload.cod_pessoa),
    cod_veiculo: readNumber(payload.cod_veiculo),
    des_veiculo: readString(payload.des_veiculo),
    nom_fantasia: readString(payload.nom_fantasia),
    nom_motorista: readString(payload.nom_motorista),
    nom_pessoa: readString(payload.nom_pessoa),
    num_cnpj_cpf: normalizeCpfCnpj(payload.num_cnpj_cpf),
    num_placa: normalizePlate(payload.num_placa),
  }
}

export function sanitizeErpClientVehiclesPayload(payload: readonly ErpClientVehiclePayload[]) {
  return payload
    .map(sanitizeErpClientVehiclePayload)
    .filter((vehicle) => vehicle.cod_veiculo > 0 && vehicle.cod_pessoa > 0 && vehicle.num_placa.length > 0)
}
