import { formatCpfCnpj, formatPhone, onlyDigits } from "@/lib"

export function normalizeDisplayName(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1))
    .join(" ")
}

export function parseClientRouteId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function formatClientDate(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(date)
}

export function formatClientDateTime(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

export function formatDurationSeconds(value: number | null | undefined, fallback: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  if (value < 60) {
    return `${Math.max(0, Math.trunc(value))}s`
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.trunc(value % 60)
  return `${minutes}min ${seconds}s`
}

export function formatClientDocument(
  value: string | null | undefined,
  fallback: string
) {
  if (!value?.trim()) {
    return fallback
  }

  return formatCpfCnpj(value)
}

export function formatClientPhone(
  value: string | null | undefined,
  fallback: string
) {
  if (!value?.trim()) {
    return fallback
  }

  const digits = onlyDigits(value)

  if (digits.length !== 10 && digits.length !== 11) {
    return value.trim()
  }

  return formatPhone(digits)
}
