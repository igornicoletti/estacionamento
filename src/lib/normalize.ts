export function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized ? normalized : null
}
