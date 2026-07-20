export type DashboardRangeKey = "today" | "7d" | "30d"

export interface DashboardIndicator {
  id: string
  label: string
  value: number
  unit: "count" | "currency" | "minutes" | "percent"
  trendPercent: number
  hint: string
}

export interface DashboardOccupancyPoint {
  hour: string
  occupancyPercent: number
  entries: number
  exits: number
}

export interface DashboardRevenuePoint {
  day: string
  revenue: number
  vehicles: number
}

export interface DashboardVehicleMovementRow {
  id: string
  plate: string
  cameraType: "entrada" | "saida"
  cameraName: string
  capturedAt: string
  confidence: number
  stayMinutes: number | null
  status: "no_patio" | "no_patio_alerta" | "fora_do_patio"
}

export interface DashboardBillingRow {
  id: string
  period: string
  vehiclesCharged: number
  averageTicket: number
  occupancyPeakPercent: number
  grossRevenue: number
}

export interface DashboardAlertRow {
  id: string
  severity: "info" | "warning" | "critical"
  title: string
  description: string
  occurredAt: string
}

export interface DashboardDataSnapshot {
  unitId: string
  unitName: string
  parkingCapacity: number
  indicators: DashboardIndicator[]
  occupancySeries: DashboardOccupancyPoint[]
  revenueSeries: DashboardRevenuePoint[]
  vehicleMovements: DashboardVehicleMovementRow[]
  billingRows: DashboardBillingRow[]
  alerts: DashboardAlertRow[]
}
