import {
  type DashboardDataSnapshot,
  type DashboardIndicator,
  type DashboardVehicleMovementRow,
} from "./dashboard-types"

export type DashboardBarMode = "flow" | "revenue"

export interface DashboardCapacitySummary {
  occupied: number
  capacity: number
  available: number
  occupancyPercent: number
}

export interface DashboardMovementStatusSummary {
  key: DashboardVehicleMovementRow["status"]
  label: string
  value: number
}

export interface DashboardRevenueSummary {
  totalRevenue: number
  totalVehicles: number
  averageTicket: number
  peakDayLabel: string
  peakDayRevenue: number
}

export interface DashboardFlowSummary {
  totalEntries: number
  totalExits: number
  balance: number
  peakOccupancyPercent: number
  peakOccupancyLabel: string
}

const movementStatusLabels: Record<DashboardVehicleMovementRow["status"], string> = {
  fora_do_patio: "Saída confirmada",
  no_patio: "No pátio",
  no_patio_alerta: "No pátio em alerta",
}

export function getDashboardIndicator(
  snapshot: Pick<DashboardDataSnapshot, "indicators">,
  indicatorId: string
) {
  return snapshot.indicators.find((indicator) => indicator.id === indicatorId)
}

export function formatDashboardIndicatorValue(
  indicator: Pick<DashboardIndicator, "unit" | "value">
) {
  if (indicator.unit === "currency") {
    return indicator.value.toLocaleString("pt-BR", {
      currency: "BRL",
      style: "currency",
    })
  }

  if (indicator.unit === "minutes") {
    return `${indicator.value.toLocaleString("pt-BR")} min`
  }

  if (indicator.unit === "percent") {
    return `${indicator.value.toLocaleString("pt-BR")}%`
  }

  return indicator.value.toLocaleString("pt-BR")
}

export function formatDashboardTrendPercent(value: number) {
  const sign = value >= 0 ? "+" : ""

  return `${sign}${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}%`
}

export function getDashboardCapacitySummary(
  snapshot: Pick<DashboardDataSnapshot, "indicators" | "parkingCapacity">
): DashboardCapacitySummary {
  const occupied =
    getDashboardIndicator(snapshot, "vehicles-in-yard")?.value ?? 0
  const capacity = Math.max(snapshot.parkingCapacity, occupied, 0)
  const available = Math.max(capacity - occupied, 0)
  const occupancyPercent =
    capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0

  return {
    available,
    capacity,
    occupied,
    occupancyPercent,
  }
}

export function getDashboardRevenueSummary(
  snapshot: Pick<DashboardDataSnapshot, "revenueSeries">
): DashboardRevenueSummary {
  const totalRevenue = snapshot.revenueSeries.reduce(
    (total, item) => total + item.revenue,
    0
  )
  const totalVehicles = snapshot.revenueSeries.reduce(
    (total, item) => total + item.vehicles,
    0
  )
  const peak = snapshot.revenueSeries.reduce(
    (currentPeak, item) =>
      item.revenue > currentPeak.revenue ? item : currentPeak,
    snapshot.revenueSeries[0] ?? { day: "-", revenue: 0, vehicles: 0 }
  )

  return {
    averageTicket: totalVehicles > 0 ? totalRevenue / totalVehicles : 0,
    peakDayLabel: peak.day,
    peakDayRevenue: peak.revenue,
    totalRevenue,
    totalVehicles,
  }
}

export function getDashboardFlowSummary(
  snapshot: Pick<DashboardDataSnapshot, "occupancySeries">
): DashboardFlowSummary {
  const totalEntries = snapshot.occupancySeries.reduce(
    (total, item) => total + item.entries,
    0
  )
  const totalExits = snapshot.occupancySeries.reduce(
    (total, item) => total + item.exits,
    0
  )
  const peak = snapshot.occupancySeries.reduce(
    (currentPeak, item) =>
      item.occupancyPercent > currentPeak.occupancyPercent
        ? item
        : currentPeak,
    snapshot.occupancySeries[0] ?? {
      entries: 0,
      exits: 0,
      hour: "-",
      occupancyPercent: 0,
    }
  )

  return {
    balance: totalEntries - totalExits,
    peakOccupancyLabel: peak.hour,
    peakOccupancyPercent: Math.round(peak.occupancyPercent),
    totalEntries,
    totalExits,
  }
}

export function getDashboardMovementStatusSummary(
  movements: readonly DashboardVehicleMovementRow[]
): DashboardMovementStatusSummary[] {
  const countByStatus = new Map<DashboardVehicleMovementRow["status"], number>()

  for (const movement of movements) {
    countByStatus.set(
      movement.status,
      (countByStatus.get(movement.status) ?? 0) + 1
    )
  }

  return (Object.keys(movementStatusLabels) as DashboardVehicleMovementRow["status"][])
    .map((key) => ({
      key,
      label: movementStatusLabels[key],
      value: countByStatus.get(key) ?? 0,
    }))
    .filter((item) => item.value > 0)
}
