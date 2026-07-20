import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { type DashboardDataSnapshot } from "../model/dashboard-types"

const occupancyChartConfig = {
  occupancyPercent: {
    label: "Ocupação (%)",
    color: "var(--primary)",
  },
  entries: {
    label: "Entradas",
    color: "hsl(142 76% 36%)",
  },
  exits: {
    label: "Saídas",
    color: "hsl(24 95% 53%)",
  },
} satisfies ChartConfig

const revenueChartConfig = {
  revenue: {
    label: "Receita (R$)",
    color: "var(--primary)",
  },
  vehicles: {
    label: "Veículos",
    color: "hsl(221 83% 53%)",
  },
} satisfies ChartConfig

export function DashboardChartsBlock({
  occupancySeries,
  revenueSeries,
}: Pick<DashboardDataSnapshot, "occupancySeries" | "revenueSeries">) {
  const [chartRange, setChartRange] = React.useState<"all" | "7" | "4">("all")

  const filteredOccupancySeries = React.useMemo(() => {
    if (chartRange === "all") {
      return occupancySeries
    }

    const length = chartRange === "7" ? 7 : 4
    return occupancySeries.slice(-length)
  }, [chartRange, occupancySeries])

  const filteredRevenueSeries = React.useMemo(() => {
    if (chartRange === "all") {
      return revenueSeries
    }

    const length = chartRange === "7" ? 7 : 4
    return revenueSeries.slice(-length)
  }, [chartRange, revenueSeries])

  return (
    <section className="grid gap-3 xl:grid-cols-2">
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Ocupação e fluxo de veículos</CardTitle>
          <CardDescription>
            Evolução da ocupação por hora com comparação entre entradas e saídas.
          </CardDescription>
          </div>
          <Select value={chartRange} onValueChange={(value) => setChartRange(value as "all" | "7" | "4")}>
            <SelectTrigger className="w-full sm:ml-auto sm:w-42.5" aria-label="Período do gráfico">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Período completo</SelectItem>
              <SelectItem value="7">Últimos 7 pontos</SelectItem>
              <SelectItem value="4">Últimos 4 pontos</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-5">
          <ChartContainer config={occupancyChartConfig} className="h-70 w-full">
            <AreaChart data={filteredOccupancySeries} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="fillOccupancy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-occupancyPercent)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-occupancyPercent)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area dataKey="occupancyPercent" type="natural" fill="url(#fillOccupancy)" stroke="var(--color-occupancyPercent)" strokeWidth={2} />
              <Area dataKey="entries" type="monotone" fill="var(--color-entries)" fillOpacity={0.15} stroke="var(--color-entries)" strokeWidth={1.5} />
              <Area dataKey="exits" type="monotone" fill="var(--color-exits)" fillOpacity={0.15} stroke="var(--color-exits)" strokeWidth={1.5} />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receita diária e volume</CardTitle>
          <CardDescription>
            Receita e quantidade de veículos por dia no período analisado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueChartConfig} className="h-70 w-full">
            <BarChart data={filteredRevenueSeries} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="vehicles" fill="var(--color-vehicles)" radius={[6, 6, 0, 0]} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  )
}
