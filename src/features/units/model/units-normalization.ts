import {
  type ErpUnitPayload,
  type Unit,
  type UnitYardConfig,
} from "./units-types"

function readString(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
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

const lowercaseDisplayWords = new Set(["da", "das", "de", "do", "dos", "e"])
const uppercaseDisplayWords = new Set([
  "BR",
  "CSC",
  "JK",
  "KM",
  "MC",
  "PV",
])
const displayTextCorrections = new Map<string, string>([
  ["administracao", "administração"],
  ["aguapei", "aguapeí"],
  ["aracariguama", "araçariguama"],
  ["balsamo", "bálsamo"],
  ["br116", "BR116"],
  ["cedral", "cedral"],
  ["candido", "cândido"],
  ["combustiveis", "combustíveis"],
  ["comercio", "comércio"],
  ["conveniencia", "conveniência"],
  ["conv.csc", "conv. CSC"],
  ["corumbatai", "corumbataí"],
  ["cuiaba", "cuiabá"],
  ["fenix", "fênix"],
  ["fe", "fé"],
  ["galia", "gália"],
  ["guara", "guará"],
  ["guarapuavao", "guarapuavão"],
  ["ilhota", "ilhota"],
  ["jose", "josé"],
  ["jundiai", "jundiaí"],
  ["marilia", "marília"],
  ["orlandia", "orlândia"],
  ["organizacao", "organização"],
  ["paulistao", "paulistão"],
  ["parana", "paraná"],
  ["paranagua", "paranaguá"],
  ["pari-quera-acu", "pariquera-açu"],
  ["pariquera-acu", "pariquera-açu"],
  ["participacoes", "participações"],
  ["piracicaba", "piracicaba"],
  ["ribeirao", "ribeirão"],
  ["sao", "são"],
  ["santopolis", "santópolis"],
  ["urania", "urânia"],
  ["uberlandia", "uberlândia"],
  ["varzea", "várzea"],
])

function capitalizeWord(value: string) {
  if (!value) {
    return ""
  }

  return `${value.charAt(0).toLocaleUpperCase("pt-BR")}${value.slice(1)}`
}

function formatDisplayWord(word: string, index: number) {
  const normalizedWord = word.toLocaleLowerCase("pt-BR")
  const correctedWord =
    displayTextCorrections.get(normalizedWord) ?? normalizedWord
  const upperCandidate = correctedWord.toLocaleUpperCase("pt-BR")

  if (
    uppercaseDisplayWords.has(upperCandidate) ||
    /^BR-?\d+$/i.test(word) ||
    /^KM\s?\d+$/i.test(word) ||
    /^\d+OWT$/i.test(word)
  ) {
    return upperCandidate
  }

  if (index > 0 && lowercaseDisplayWords.has(correctedWord)) {
    return correctedWord
  }

  return correctedWord
    .split("-")
    .map((part) => capitalizeWord(part))
    .join("-")
}

function sanitizeDisplayText(value: unknown) {
  return readString(value)
    .split(" ")
    .filter(Boolean)
    .map(formatDisplayWord)
    .join(" ")
}

function formatCnpj(value: unknown) {
  const digits = readString(value).replace(/\D/g, "")

  if (digits.length !== 14) {
    return readString(value)
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function sanitizeErpUnitPayload(payload: ErpUnitPayload): Unit {
  return {
    cod_empresa: readNumber(payload.cod_empresa),
    nom_razao_social: sanitizeDisplayText(payload.nom_razao_social),
    nom_fantasia: sanitizeDisplayText(payload.nom_fantasia),
    num_cnpj: formatCnpj(payload.num_cnpj),
    cod_bandeira: readNumber(payload.cod_bandeira),
    des_bandeira: sanitizeDisplayText(payload.des_bandeira),
    cod_cidade: readNumber(payload.cod_cidade),
    nom_cidade: sanitizeDisplayText(payload.nom_cidade),
    nom_estado: sanitizeDisplayText(payload.nom_estado),
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

export function normalizeUnitYardConfig(
  config: UnitYardConfig,
): UnitYardConfig {
  return {
    unitId: config.unitId.trim(),
    patioActive: Boolean(config.patioActive),
    parkingSpots: sanitizeParkingSpots(config.parkingSpots),
    updatedAt: config.updatedAt,
  }
}

export function normalizeUnitYardConfigs(configs: readonly UnitYardConfig[]) {
  return configs
    .map(normalizeUnitYardConfig)
    .filter((config) => config.unitId.length > 0)
}
