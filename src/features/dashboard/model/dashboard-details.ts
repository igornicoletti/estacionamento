import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { type DashboardAlertRow, type DashboardBillingRow, type DashboardVehicleMovementRow } from "./dashboard-types"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR")
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function getVehicleMovementDetailItems(row: DashboardVehicleMovementRow): readonly AppDetailsSheetItem[] {
  return [
    { label: "Placa", value: row.plate },
    { label: "Câmera", value: row.cameraName },
    { label: "Tipo de captura", value: row.cameraType },
    { label: "Data/hora", value: formatDateTime(row.capturedAt) },
    { label: "Confiança", value: `${row.confidence.toFixed(1)}%` },
    { label: "Permanência", value: row.stayMinutes ? `${row.stayMinutes} min` : "—" },
    {
      label: "Status",
      value: row.status === "no_patio" ? "No pátio" : row.status === "fora_do_patio" ? "Saída confirmada" : "No pátio (alerta)",
    },
  ]
}

export function getBillingDetailItems(row: DashboardBillingRow): readonly AppDetailsSheetItem[] {
  return [
    { label: "Período", value: row.period },
    { label: "Veículos cobrados", value: row.vehiclesCharged.toLocaleString("pt-BR") },
    { label: "Ticket médio", value: formatMoney(row.averageTicket) },
    { label: "Pico de ocupação", value: `${row.occupancyPeakPercent}%` },
    { label: "Faturamento bruto", value: formatMoney(row.grossRevenue) },
  ]
}

export function getAlertDetailItems(row: DashboardAlertRow): readonly AppDetailsSheetItem[] {
  return [
    { label: "Severidade", value: row.severity },
    { label: "Título", value: row.title },
    { label: "Descrição", value: row.description },
    { label: "Data/hora", value: formatDateTime(row.occurredAt) },
  ]
}
