export function resolveVisibleSensitiveValue(
  ...values: readonly (string | null | undefined)[]
) {
  for (const value of values) {
    const normalized = value?.trim()

    if (normalized && !normalized.includes("*")) {
      return normalized
    }
  }

  return null
}
