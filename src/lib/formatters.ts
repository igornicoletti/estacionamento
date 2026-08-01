const humanTextLowercaseWords = new Set([
  "a",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "ou",
  "para",
  "por",
])

const humanTextUppercaseTokens = new Set([
  "BR",
  "CNPJ",
  "CPF",
  "EPP",
  "ERP",
  "IP",
  "LTDA",
  "ME",
  "RMC",
  "S/A",
  "SA",
  "UF",
  "VIP",
])

const humanTextAccentedTokens: Readonly<Record<string, string>> = {
  acucar: "açúcar",
  acu: "açu",
  administracao: "administração",
  atualizacao: "atualização",
  conceicao: "conceição",
  configuracao: "configuração",
  joao: "João",
  jose: "José",
  patio: "pátio",
  ribeirao: "Ribeirão",
  sao: "São",
  veiculo: "veículo",
  veiculos: "veículos",
}

function capitalizeHumanTextToken(value: string) {
  return value.replace(
    /(^|[-'’])(\p{L})/gu,
    (_match, separator: string, character: string) =>
      `${separator}${character.toLocaleUpperCase("pt-BR")}`
  )
}

function formatHumanTextToken(value: string, index: number) {
  const uppercaseValue = value.toLocaleUpperCase("pt-BR")
  const acronymKey = uppercaseValue.replace(/[.,;:]+$/u, "")

  if (humanTextUppercaseTokens.has(acronymKey)) {
    return uppercaseValue
  }

  const prefixedCode = uppercaseValue.match(/^([A-Z]{2,})-(\d.*)$/u)

  if (prefixedCode && humanTextUppercaseTokens.has(prefixedCode[1])) {
    return `${prefixedCode[1]}-${prefixedCode[2]}`
  }

  const lowercaseValue = value.toLocaleLowerCase("pt-BR")

  if (index > 0 && humanTextLowercaseWords.has(lowercaseValue)) {
    return lowercaseValue
  }

  return value.replace(/\p{L}+/gu, (word) => {
    const normalizedWord = word.toLocaleLowerCase("pt-BR")
    const accentedWord = humanTextAccentedTokens[normalizedWord]

    return capitalizeHumanTextToken(accentedWord ?? normalizedWord)
  })
}

function restoreHumanTextDiacritics(value: string) {
  return value.replace(/\p{L}+/gu, (word) => {
    const lowercaseWord = word.toLocaleLowerCase("pt-BR")
    const replacement = humanTextAccentedTokens[lowercaseWord]

    if (!replacement) {
      return word
    }

    if (word === word.toLocaleUpperCase("pt-BR")) {
      return replacement.toLocaleUpperCase("pt-BR")
    }

    if (word === word.toLocaleLowerCase("pt-BR")) {
      return replacement
    }

    return capitalizeHumanTextToken(replacement)
  })
}

export function formatHumanReadableText(
  value: string | null | undefined
) {
  const normalized = restoreHumanTextDiacritics(value
    ?.replace(/\s+/gu, " ")
    .trim()
    .normalize("NFC") ?? "")

  if (!normalized || !/\p{L}/u.test(normalized)) {
    return normalized
  }

  const isUniformCase =
    normalized === normalized.toLocaleUpperCase("pt-BR") ||
    normalized === normalized.toLocaleLowerCase("pt-BR")

  if (!isUniformCase) {
    return normalized
  }

  return normalized
    .split(" ")
    .map(formatHumanTextToken)
    .join(" ")
}

export function formatNullableText(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized ? normalized : "-"
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
})

function parseDate(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Formats an ISO timestamp (or Date) as a localized pt-BR date + time string.
 * Returns the fallback when the value is empty or cannot be parsed.
 */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  fallback = "—"
) {
  const date = parseDate(value)

  return date ? dateTimeFormatter.format(date) : fallback
}

/**
 * Formats an ISO timestamp (or Date) as a localized pt-BR date string.
 * Returns the fallback when the value is empty or cannot be parsed.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  fallback = "—"
) {
  const date = parseDate(value)

  return date ? dateFormatter.format(date) : fallback
}
