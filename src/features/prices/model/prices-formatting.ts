export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatIntegerUnit(value: number, unit: string) {
  return `${Intl.NumberFormat("pt-BR").format(value)} ${unit}`
}

export function formatNullableDateTime(value: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}
