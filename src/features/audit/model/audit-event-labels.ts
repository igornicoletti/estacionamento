import { auditEventLabels } from "../constants"

export function humanizeAuditIdentifier(value: string) {
  const humanized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")

  if (!humanized) {
    return ""
  }

  return humanized.charAt(0).toLocaleUpperCase("pt-BR") + humanized.slice(1)
}

export function getAuditEventLabel(event: string): string {
  const mappedLabel = auditEventLabels[event]

  if (mappedLabel) {
    return mappedLabel
  }

  return humanizeAuditIdentifier(event) || event
}
