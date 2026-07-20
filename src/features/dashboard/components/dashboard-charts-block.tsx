import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { type DashboardDataSnapshot } from "../model/dashboard-types"

type ChartRange = "day" | "week" | "month"

type ChartPoint = {
  label: string
  occupancyPercent: number
  entries: number
  exits: number
}

const chartConfig = {
  occupancyPercent: {
    label: "Ocupação",
    color: "var(--primary)",
  },
  entries: {
    label: "Entradas",
    color: "color-mix(in oklab, var(--primary) 78%, white)",
  },
  exits: {
    label: "Saídas",
    color: "color-mix(in oklab, var(--primary) 60%, white)",
  },
} satisfies ChartConfig

const daySeries: ChartPoint[] = [
  { label: "06:00", occupancyPercent: 22, entries: 14, exits: 6 },
  { label: "08:00", occupancyPercent: 44, entries: 28, exits: 13 },
  { label: "10:00", occupancyPercent: 63, entries: 33, exits: 16 },
  { label: "12:00", occupancyPercent: 71, entries: 29, exits: 22 },
  { label: "14:00", occupancyPercent: 78, entries: 34, exits: 26 },
  { label: "16:00", occupancyPercent: 81, entries: 31, exits: 21 },
  { label: "18:00", occupancyPercent: 69, entries: 20, exits: 29 },
  { label: "20:00", occupancyPercent: 54, entries: 13, exits: 23 },
]

const weekSeries: ChartPoint[] = [
  { label: "Seg", occupancyPercent: 62, entries: 118, exits: 94 },
  { label: "Ter", occupancyPercent: 68, entries: 126, exits: 101 },
  { label: "Qua", occupancyPercent: 71, entries: 133, exits: 109 },
  { label: "Qui", occupancyPercent: 74, entries: 141, exits: 116 },
  { label: "Sex", occupancyPercent: 78, entries: 149, exits: 122 },
  { label: "Sáb", occupancyPercent: 73, entries: 128, exits: 130 },
  { label: "Dom", occupancyPercent: 59, entries: 97, exits: 112 },
]

const monthSeries: ChartPoint[] = [
  { label: "Sem 1", occupancyPercent: 63, entries: 540, exits: 487 },
  { label: "Sem 2", occupancyPercent: 69, entries: 610, exits: 552 },
  { label: "Sem 3", occupancyPercent: 74, entries: 655, exits: 603 },
  { label: "Sem 4", occupancyPercent: 71, entries: 592, exits: 571 },
]

const periodDescriptionByRange: Record<ChartRange, string> = {
  day: "Exibe a evolução por hora da unidade selecionada.",
  week: "Exibe a evolução por dia da unidade selecionada.",
  month: "Exibe a evolução por semana da unidade selecionada.",
}

const seriesByRange: Record<ChartRange, ChartPoint[]> = {
  day: daySeries,
  week: weekSeries,
  month: monthSeries,
}

function getChartTooltipLabelFormatter(range: ChartRange) {
  if (range === "day") {
    return (value: React.ReactNode) => `Horário ${String(value)}`
  }

  if (range === "week") {
    return (value: React.ReactNode) => `Dia ${String(value)}`
  }

  return (value: React.ReactNode) => `Semana ${String(value)}`
}

export function DashboardChartsBlock({
  occupancySeries,
  revenueSeries,
}: Pick<DashboardDataSnapshot, "occupancySeries" | "revenueSeries">) {
  const [chartRange, setChartRange] = React.useState<ChartRange>("day")

  const chartData = React.useMemo(() => {
    if (chartRange === "day") {
      return occupancySeries.map((item) => ({
        label: item.hour,
        occupancyPercent: item.occupancyPercent,
        entries: item.entries,
        exits: item.exits,
      }))
    }

    if (chartRange === "week") {
      return seriesByRange.week.map((item, index) => ({
        ...item,
        occupancyPercent: Math.min(100, Math.round((revenueSeries[index]?.vehicles ?? 0) * 0.55)),
      }))
    }

    return seriesByRange.month.map((item, index) => ({
      ...item,
      occupancyPercent: Math.min(100, Math.round(60 + index * 4 + (revenueSeries[index]?.vehicles ?? 0) * 0.1)),
    }))
  }, [chartRange, occupancySeries, revenueSeries])

  return (
    <section className="grid gap-3">
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Ocupação, entradas e saídas</CardTitle>
            <CardDescription>{periodDescriptionByRange[chartRange]}</CardDescription>
          </div>
          <Select value={chartRange} onValueChange={(value) => setChartRange(value as ChartRange)}>
            <SelectTrigger className="w-full sm:ml-auto sm:w-40" aria-label="Período do gráfico">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
            <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="fillOccupancy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-occupancyPercent)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-occupancyPercent)" stopOpacity={0.12} />
                </linearGradient>
                <linearGradient id="fillEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-entries)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-entries)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillExits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-exits)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-exits)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <ChartTooltip
                cursor={false}
                content={(
                  <ChartTooltipContent
                    labelFormatter={getChartTooltipLabelFormatter(chartRange)}
                    indicator="dot"
                  />
                )}
              />
              <Area
                dataKey="occupancyPercent"
                type="natural"
                fill="url(#fillOccupancy)"
                stroke="var(--color-occupancyPercent)"
                strokeWidth={2}
              />
              <Area
                dataKey="entries"
                type="natural"
                fill="url(#fillEntries)"
                stroke="var(--color-entries)"
                strokeWidth={2}
              />
              <Area
                dataKey="exits"
                type="natural"
                fill="url(#fillExits)"
                stroke="var(--color-exits)"
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  )
}
