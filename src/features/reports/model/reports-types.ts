export type ReportsTabKey = "vehicle_movement" | "billing" | "occupancy_alerts"

export interface ReportsVehicleMovementRow {
  id: string
  capturedAt: string
  plate: string
  cameraType: "entrada" | "saida"
  cameraName: string
  confidence: number
  stayMinutes: number | null
  status: "no_patio" | "no_patio_alerta" | "fora_do_patio"
}

export interface ReportsBillingRow {
  id: string
  referenceDate: string
  vehiclesCharged: number
  averageTicket: number
  grossRevenue: number
  rulesVersionLabel: string
  pricesVersionLabel: string
}

export interface ReportsOccupancyAlertRow {
  id: string
  occurredAt: string
  occupancyPercent: number
  capacity: number
  availableSpots: number
  severity: "info" | "warning" | "critical"
  description: string
}

export interface ReportsSnapshot {
  unitId: string
  unitName: string
  vehicleMovements: ReportsVehicleMovementRow[]
  billingRows: ReportsBillingRow[]
  occupancyAlerts: ReportsOccupancyAlertRow[]
}
