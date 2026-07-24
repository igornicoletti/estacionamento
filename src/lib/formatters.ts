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
