export function normalizeDisplayName(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1))
    .join(" ")
}

export function parseClientRouteId(value: string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null
}
