import { auditCopy } from "../constants/audit-copy"
import { humanizeAuditIdentifier } from "./audit-event-labels"

const MAX_AUDIT_DISPLAY_TEXT_LENGTH = 1_000
const auditTechnicalValueLabels: Readonly<Record<string, string>> =
  auditCopy.technical.valueLabels
const auditMetadataValueLabels: Readonly<Record<string, string>> =
  auditCopy.metadata.values
const auditNumberFormatter = new Intl.NumberFormat("pt-BR")

function normalizeVisibleText(value: string) {
  const textWithoutControlCharacters = Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0)

      return (
        codePoint !== undefined &&
        (codePoint === 9 ||
          codePoint === 10 ||
          codePoint === 13 ||
          (codePoint >= 32 && codePoint !== 127))
      )
    })
    .join("")

  return textWithoutControlCharacters
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, MAX_AUDIT_DISPLAY_TEXT_LENGTH)
}

function redactTechnicalText(value: string) {
  const lowerValue = value.toLocaleLowerCase("pt-BR")

  if (
    lowerValue.includes("notvalidforname") ||
    lowerValue.includes("invalid peer certificate")
  ) {
    return auditCopy.technical.messages.certificate
  }

  if (
    lowerValue.includes("error sending request") ||
    lowerValue.includes("client error")
  ) {
    return auditCopy.technical.messages.externalService
  }

  return value.replace(/https?:\/\/\S+/giu, "serviço externo")
}

export function formatAuditDisplayText(value: string) {
  return redactTechnicalText(normalizeVisibleText(value))
}

export function getAuditEntityLabel(value: string) {
  const normalizedValue = formatAuditDisplayText(value)

  if (!/^[a-z][a-z0-9_.-]*$/iu.test(normalizedValue)) {
    return normalizedValue
  }

  return (
    auditTechnicalValueLabels[normalizedValue.toLocaleLowerCase("pt-BR")] ??
    humanizeAuditIdentifier(normalizedValue)
  )
}

export function formatAuditMetadataValue(value: unknown): string | null {
  if (typeof value === "string") {
    const normalizedValue = formatAuditDisplayText(value)

    if (!normalizedValue) {
      return null
    }

    return (
      auditMetadataValueLabels[
        normalizedValue.toLocaleLowerCase("pt-BR")
      ] ??
      (/^[a-z][a-z0-9_.-]*$/iu.test(normalizedValue)
        ? humanizeAuditIdentifier(normalizedValue)
        : normalizedValue)
    )
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return auditNumberFormatter.format(value)
  }

  if (typeof value === "boolean") {
    return value ? auditCopy.labels.yes : auditCopy.labels.no
  }

  return null
}
