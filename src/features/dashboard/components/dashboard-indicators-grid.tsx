import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { type DashboardIndicator } from "../model/dashboard-types"

function formatIndicatorValue(value: number, unit: DashboardIndicator["unit"]) {
  if (unit === "currency") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  if (unit === "minutes") {
    return `${value.toLocaleString("pt-BR")} min`
  }

  if (unit === "percent") {
    return `${value.toLocaleString("pt-BR")}%`
  }

  return value.toLocaleString("pt-BR")
}

function formatTrendLabel(value: number) {
  const signal = value >= 0 ? "+" : ""
  return `${signal}${value.toFixed(1)}%`
}

export function DashboardIndicatorsGrid({ indicators }: { indicators: readonly DashboardIndicator[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {indicators.map((indicator) => (
        <Card key={indicator.id} size="sm">
          <CardHeader>
            <CardTitle>{indicator.label}</CardTitle>
            <CardDescription>{indicator.hint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">
              {formatIndicatorValue(indicator.value, indicator.unit)}
            </p>
            <p className="text-xs text-muted-foreground">
              Tendência: {formatTrendLabel(indicator.trendPercent)}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
