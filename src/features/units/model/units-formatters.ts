export function formatUnitOptionLabel(
  code: number | string,
  name: string,
) {
  return `${String(code).padStart(3, "0")} — ${name}`
}
