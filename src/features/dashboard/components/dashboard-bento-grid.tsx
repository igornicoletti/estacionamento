import {
  AlertTriangleIcon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CarFrontIcon,
  CircleParkingIcon,
  ClockIcon,
  DollarSignIcon,
  TrendingUpIcon,
} from "lucide-react"
import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatParkingAlertSeverity } from "@/features/operations/model/parking-movement-formatters"

import {
  formatDashboardIndicatorValue,
  formatDashboardTrendPercent,
  getDashboardCapacitySummary,
  getDashboardFlowSummary,
  getDashboardMovementStatusSummary,
  getDashboardRevenueSummary,
  type DashboardBarMode,
  type DashboardMovementStatusSummary,
} from "../model/dashboard-analytics"
import {
  type DashboardAlertRow,
  type DashboardDataSnapshot,
  type DashboardVehicleMovementRow,
} from "../model/dashboard-types"
import { createDashboardMovementsColumns } from "../table"

const DASHBOARD_MOVEMENTS_LIMIT = 8
const DASHBOARD_ALERTS_LIMIT = 6

const statusChartConfig = {
  fora_do_patio: {
    label: "Saída confirmada",
    color: "var(--primary)",
  },
  no_patio: {
    label: "No pátio",
    color: "var(--success)",
  },
  no_patio_alerta: {
    label: "No pátio em alerta",
    color: "var(--warning)",
  },
} satisfies ChartConfig

const flowChartConfig = {
  entries: {
    label: "Entradas",
    color: "var(--primary)",
  },
  exits: {
    label: "Saídas",
    color: "color-mix(in oklab, var(--primary) 45%, var(--muted-foreground))",
  },
} satisfies ChartConfig

const revenueChartConfig = {
  revenue: {
    label: "Receita",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const capacityChartConfig = {
  occupancyPercent: {
    label: "Vagas ocupadas",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    currency: "BRL",
    style: "currency",
  })
}

function formatInteger(value: number) {
  return value.toLocaleString("pt-BR")
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  })
}

function getIndicatorIcon(indicatorId: string) {
  if (indicatorId === "vehicles-in-yard") {
    return <CarFrontIcon aria-hidden="true" />
  }

  if (indicatorId === "occupancy") {
    return <CircleParkingIcon aria-hidden="true" />
  }

  if (indicatorId === "avg-stay") {
    return <ClockIcon aria-hidden="true" />
  }

  if (indicatorId === "gross-revenue") {
    return <DollarSignIcon aria-hidden="true" />
  }

  return <TrendingUpIcon aria-hidden="true" />
}

function getStatusFill(status: DashboardMovementStatusSummary["key"]) {
  return `var(--color-${status})`
}

function DashboardBentoCard({
  children,
  className,
}: React.ComponentProps<typeof Card>) {
  return (
    <Card size="sm" className={cn("min-w-0 overflow-hidden", className)}>
      {children}
    </Card>
  )
}

function DashboardCapacityCard({
  snapshot,
}: {
  snapshot: DashboardDataSnapshot
}) {
  const capacity = getDashboardCapacitySummary(snapshot)
  const radialData = [
    {
      occupancyPercent: capacity.occupancyPercent,
    },
  ]

  return (
    <DashboardBentoCard className="md:col-span-1 xl:col-span-2 xl:row-span-2">
      <CardHeader>
        <CardTitle>Vagas da unidade</CardTitle>
        <CardDescription>
          Ocupação atual sobre a capacidade configurada.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid min-h-[24rem] content-between gap-4">
        <ChartContainer
          config={capacityChartConfig}
          className="mx-auto aspect-square h-[15rem] max-h-[260px] w-full"
          role="img"
          aria-label="Gráfico radial de vagas ocupadas"
        >
          <RadialBarChart
            data={radialData}
            endAngle={-270}
            innerRadius="74%"
            outerRadius="94%"
            startAngle={90}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background
              cornerRadius={12}
              dataKey="occupancyPercent"
              fill="var(--color-occupancyPercent)"
            />
            <PolarRadiusAxis axisLine={false} tick={false} tickLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null
                  }

                  return (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      x={viewBox.cx}
                      y={viewBox.cy}
                    >
                      <tspan
                        className="fill-foreground text-3xl font-semibold"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        {formatInteger(capacity.occupied)}
                      </tspan>
                      <tspan
                        className="fill-muted-foreground text-xs"
                        x={viewBox.cx}
                        y={(Number(viewBox.cy) || 0) + 22}
                      >
                        de {formatInteger(capacity.capacity)} vagas
                      </tspan>
                    </text>
                  )
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>

        <div className="grid gap-3 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Ocupadas</span>
            <span className="font-medium tabular-nums">
              {formatInteger(capacity.occupied)} de{" "}
              {formatInteger(capacity.capacity)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Disponíveis</span>
            <span className="font-medium tabular-nums">
              {formatInteger(capacity.available)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Ocupação</span>
            <Badge variant="outline">{capacity.occupancyPercent}%</Badge>
          </div>
        </div>
      </CardContent>
    </DashboardBentoCard>
  )
}

function DashboardBarChartCard({
  snapshot,
}: {
  snapshot: DashboardDataSnapshot
}) {
  const [barMode, setBarMode] = React.useState<DashboardBarMode>("flow")
  const chartData = React.useMemo(() => {
    if (barMode === "revenue") {
      return snapshot.revenueSeries.map((item) => ({
        entries: 0,
        exits: 0,
        label: item.day,
        revenue: item.revenue,
      }))
    }

    return snapshot.occupancySeries.map((item) => ({
      entries: item.entries,
      exits: item.exits,
      label: item.hour,
      revenue: 0,
    }))
  }, [barMode, snapshot.occupancySeries, snapshot.revenueSeries])
  const chartConfig =
    barMode === "revenue" ? revenueChartConfig : flowChartConfig

  return (
    <DashboardBentoCard className="md:col-span-2 xl:col-span-4">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <CardTitle>
            {barMode === "revenue" ? "Receita por dia" : "Entradas e saídas"}
          </CardTitle>
          <CardDescription>
            {barMode === "revenue"
              ? "Faturamento monitorado por dia da semana."
              : "Volume operacional por horário do dia."}
          </CardDescription>
        </div>
        <Select
          value={barMode}
          onValueChange={(value) => setBarMode(value as DashboardBarMode)}
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Selecionar visualização do gráfico"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            <SelectItem value="flow">Movimentação</SelectItem>
            <SelectItem value="revenue">Receita</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[18rem] w-full"
          role="img"
          aria-label="Gráfico de barras do dashboard"
        >
          <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tickLine={false}
              tickMargin={10}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            {barMode === "revenue" ? (
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={5} />
            ) : (
              <>
                <Bar
                  dataKey="entries"
                  fill="var(--color-entries)"
                  radius={[0, 0, 5, 5]}
                  stackId="flow"
                />
                <Bar
                  dataKey="exits"
                  fill="var(--color-exits)"
                  radius={[5, 5, 0, 0]}
                  stackId="flow"
                />
              </>
            )}
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </DashboardBentoCard>
  )
}

function DashboardMetricsCard({
  snapshot,
}: {
  snapshot: DashboardDataSnapshot
}) {
  return (
    <DashboardBentoCard className="md:col-span-1 xl:col-span-2">
      <CardHeader>
        <CardTitle>Indicadores operacionais</CardTitle>
        <CardDescription>
          Principais valores da unidade selecionada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-1">
          {snapshot.indicators.map((indicator) => (
            <Item key={indicator.id} className="px-0">
              <ItemMedia
                variant="icon"
                className="size-9 rounded-md bg-muted text-muted-foreground"
              >
                {getIndicatorIcon(indicator.id)}
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{indicator.label}</ItemTitle>
                <ItemDescription>{indicator.hint}</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto flex-col items-end gap-1 text-right">
                <span className="font-medium tabular-nums">
                  {formatDashboardIndicatorValue(indicator)}
                </span>
                <Badge variant="outline">
                  {formatDashboardTrendPercent(indicator.trendPercent)}
                </Badge>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </DashboardBentoCard>
  )
}

function DashboardMovementStatusCard({
  movements,
}: {
  movements: readonly DashboardVehicleMovementRow[]
}) {
  const statusData = React.useMemo(
    () =>
      getDashboardMovementStatusSummary(movements).map((item) => ({
        ...item,
        fill: getStatusFill(item.key),
      })),
    [movements],
  )
  const total = statusData.reduce((sum, item) => sum + item.value, 0)

  return (
    <DashboardBentoCard className="md:col-span-1 xl:col-span-2">
      <CardHeader>
        <CardTitle>Status das movimentações</CardTitle>
        <CardDescription>
          Distribuição dos últimos registros de câmera.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <AppEmptyState
            media={<CarFrontIcon />}
            title="Sem movimentações"
            description="A unidade não possui registros recentes."
          />
        ) : (
          <ChartContainer
            config={statusChartConfig}
            className="mx-auto aspect-square h-[17rem] w-full"
            role="img"
            aria-label="Gráfico de status das movimentações"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="key" />}
              />
              <Pie
                data={statusData}
                dataKey="value"
                innerRadius={66}
                nameKey="key"
                strokeWidth={5}
              >
                {statusData.map((item) => (
                  <Cell key={item.key} fill={item.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                      return null
                    }

                    return (
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        <tspan
                          className="fill-foreground text-3xl font-semibold"
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          {formatInteger(total)}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground text-xs"
                          x={viewBox.cx}
                          y={(Number(viewBox.cy) || 0) + 22}
                        >
                          registros
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="key" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </DashboardBentoCard>
  )
}

function DashboardRevenueCard({
  snapshot,
}: {
  snapshot: DashboardDataSnapshot
}) {
  const revenue = getDashboardRevenueSummary(snapshot)
  const flow = getDashboardFlowSummary(snapshot)

  return (
    <DashboardBentoCard className="md:col-span-1 xl:col-span-2">
      <CardHeader>
        <CardTitle>Resultado monitorado</CardTitle>
        <CardDescription>
          Receita, giro e pico operacional do período.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Receita acumulada</p>
          <p className="text-3xl font-semibold tracking-tight">
            {formatCurrency(revenue.totalRevenue)}
          </p>
        </div>
        <div className="grid gap-3 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Ticket médio</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(revenue.averageTicket)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Veículos cobrados
            </span>
            <span className="font-medium tabular-nums">
              {formatInteger(revenue.totalVehicles)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Pico de ocupação
            </span>
            <span className="font-medium tabular-nums">
              {flow.peakOccupancyPercent}% às {flow.peakOccupancyLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Maior receita</span>
            <span className="font-medium tabular-nums">
              {revenue.peakDayLabel}, {formatCurrency(revenue.peakDayRevenue)}
            </span>
          </div>
        </div>
      </CardContent>
    </DashboardBentoCard>
  )
}

function DashboardMovementsCard({
  movements,
  onOpenDetails,
}: {
  movements: readonly DashboardVehicleMovementRow[]
  onOpenDetails?: (row: DashboardVehicleMovementRow) => void
}) {
  const movementColumns = React.useMemo(
    () => createDashboardMovementsColumns({ onOpenDetails }),
    [onOpenDetails],
  )
  const limitedMovements = React.useMemo(
    () => movements.slice(0, DASHBOARD_MOVEMENTS_LIMIT),
    [movements],
  )

  return (
    <DashboardBentoCard className="md:col-span-2 xl:col-span-4">
      <CardHeader>
        <CardTitle>Movimentações recentes de veículos</CardTitle>
        <CardDescription>
          Leituras recentes das câmeras e status operacional no pátio.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden">
        <DataTable
          columns={movementColumns}
          data={limitedMovements}
          emptyState={
            <AppEmptyState
              media={<CarFrontIcon />}
              title="Nenhuma movimentação encontrada"
              description="A unidade não possui registros recentes."
            />
          }
          enableExport={false}
          enablePagination={false}
          enableViewOptions={false}
          getRowId={(row) => row.id}
          surface="plain"
        />
      </CardContent>
    </DashboardBentoCard>
  )
}

function DashboardAlertsCard({
  alerts,
  onOpenDetails,
}: {
  alerts: readonly DashboardAlertRow[]
  onOpenDetails?: (row: DashboardAlertRow) => void
}) {
  const limitedAlerts = React.useMemo(
    () => alerts.slice(0, DASHBOARD_ALERTS_LIMIT),
    [alerts],
  )

  return (
    <DashboardBentoCard className="md:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle>Alertas operacionais</CardTitle>
        <CardDescription>
          Ocorrências críticas e informativas da unidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {limitedAlerts.length === 0 ? (
          <AppEmptyState
            media={<AlertTriangleIcon />}
            title="Nenhum alerta encontrado"
            description="A unidade não possui alertas recentes."
          />
        ) : (
          <ScrollArea className="max-h-[25rem] pr-1">
            <ItemGroup className="gap-1">
              {limitedAlerts.map((alert) => (
                <Item key={alert.id} asChild className="px-0">
                  <button
                    type="button"
                    className="cursor-pointer text-left"
                    onClick={() => onOpenDetails?.(alert)}
                  >
                    <ItemMedia>
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {formatParkingAlertSeverity(alert.severity)}
                      </Badge>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{alert.title}</ItemTitle>
                      <ItemDescription>{alert.description}</ItemDescription>
                    </ItemContent>
                    <ItemActions className="ml-auto text-right">
                      <span className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDateTime(alert.occurredAt)}
                      </span>
                    </ItemActions>
                  </button>
                </Item>
              ))}
            </ItemGroup>
          </ScrollArea>
        )}
      </CardContent>
    </DashboardBentoCard>
  )
}

function DashboardFlowBalanceCard({
  snapshot,
}: {
  snapshot: DashboardDataSnapshot
}) {
  const flow = getDashboardFlowSummary(snapshot)

  return (
    <DashboardBentoCard className="md:col-span-1 xl:col-span-2">
      <CardHeader>
        <CardTitle>Balanço de fluxo</CardTitle>
        <CardDescription>
          Entrada e saída acumuladas na série operacional.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDownToLineIcon aria-hidden="true" className="size-4" />
              Entradas
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatInteger(flow.totalEntries)}
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpFromLineIcon aria-hidden="true" className="size-4" />
              Saídas
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatInteger(flow.totalExits)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-sm text-muted-foreground">
            Saldo operacional
          </span>
          <Badge variant={flow.balance >= 0 ? "default" : "outline"}>
            {flow.balance >= 0 ? "+" : ""}
            {formatInteger(flow.balance)}
          </Badge>
        </div>
      </CardContent>
    </DashboardBentoCard>
  )
}

export function DashboardBentoGrid({
  onOpenAlertDetails,
  onOpenMovementDetails,
  snapshot,
}: {
  snapshot: DashboardDataSnapshot
  onOpenMovementDetails?: (row: DashboardVehicleMovementRow) => void
  onOpenAlertDetails?: (row: DashboardAlertRow) => void
}) {
  return (
    <section className="grid auto-rows-min gap-3 md:grid-cols-2 xl:grid-cols-6">
      <DashboardCapacityCard snapshot={snapshot} />
      <DashboardBarChartCard snapshot={snapshot} />
      <DashboardMetricsCard snapshot={snapshot} />
      <DashboardMovementStatusCard movements={snapshot.vehicleMovements} />
      <DashboardRevenueCard snapshot={snapshot} />
      <DashboardFlowBalanceCard snapshot={snapshot} />
      <DashboardMovementsCard
        movements={snapshot.vehicleMovements}
        onOpenDetails={onOpenMovementDetails}
      />
      <DashboardAlertsCard
        alerts={snapshot.alerts}
        onOpenDetails={onOpenAlertDetails}
      />
    </section>
  )
}
