export type ParkingCameraType = "entrada" | "saida"

export type ParkingMovementStatus =
  "fora_do_patio" | "no_patio" | "no_patio_alerta"

export type ParkingAlertSeverity = "critical" | "info" | "warning"

const cameraTypeLabels: Record<ParkingCameraType, string> = {
  entrada: "Entrada",
  saida: "Saída",
}

const movementStatusLabels: Record<ParkingMovementStatus, string> = {
  fora_do_patio: "Saída confirmada",
  no_patio: "No pátio",
  no_patio_alerta: "No pátio em alerta",
}

const alertSeverityLabels: Record<ParkingAlertSeverity, string> = {
  critical: "Crítico",
  info: "Informativo",
  warning: "Alerta",
}

export function formatParkingCameraType(value: ParkingCameraType) {
  return cameraTypeLabels[value]
}

export function formatParkingMovementStatus(value: ParkingMovementStatus) {
  return movementStatusLabels[value]
}

export function formatParkingAlertSeverity(value: ParkingAlertSeverity) {
  return alertSeverityLabels[value]
}
