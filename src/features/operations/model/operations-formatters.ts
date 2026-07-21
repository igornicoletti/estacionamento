import {
  type OperationalCameraType,
  type OperationalCaptureStatus,
  type OperationalFinancialReason,
  type OperationalFinancialStatus,
  type OperationalIssueCode,
  type OperationalReadQuality,
  type OperationalRegistrationStatus,
} from "./operations-types"

export const operationalCameraTypeLabels: Record<OperationalCameraType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  unknown: "Tipo não informado",
}

export const operationalCaptureStatusLabels: Record<OperationalCaptureStatus, string> = {
  exit_read: "Saída lida",
  inconsistent: "Divergente",
  open_entry: "No pátio",
  paired: "Pareado",
}

export const operationalRegistrationStatusLabels: Record<OperationalRegistrationStatus, string> = {
  linked: "Vinculado",
  unlinked: "Sem vínculo",
}

export const operationalReadQualityLabels: Record<OperationalReadQuality, string> = {
  high: "Alta",
  low: "Baixa",
  medium: "Média",
  unknown: "Não informada",
}

export const operationalFinancialStatusLabels: Record<OperationalFinancialStatus, string> = {
  benefit: "Benefício",
  chargeable: "A cobrar",
  exempt_vip: "VIP",
  justified_exit: "Justificada",
  lost_by_failure: "Perda por falha",
  paid: "Pago",
  paid_elsewhere: "Pago em outra unidade",
  pending: "Pendente",
}

export const operationalFinancialReasonLabels: Record<OperationalFinancialReason, string> = {
  camera_failure: "Falha de câmera",
  cross_unit_payment: "Pagamento em outra unidade",
  fuel_benefit: "Benefício de abastecimento",
  manual_justification: "Justificativa manual",
  network_failure: "Falha de rede",
  standard_charge: "Cobrança normal",
  unpaired_capture: "Captura não pareada",
  unpaid_exit: "Saída sem pagamento",
  vip_client: "Cliente VIP",
  vip_vehicle: "Veículo VIP",
}

export const operationalIssueLabels: Record<OperationalIssueCode, string> = {
  capture_failure_revenue_loss: "Receita não capturada por falha operacional",
  low_confidence: "Confiança baixa",
  manual_justification: "Saída justificada manualmente",
  missing_camera_type: "Tipo de câmera não informado",
  missing_image: "Imagem não confirmada",
  missing_timestamp: "Data/hora não informada",
  missing_unit: "Unidade não informada",
  negative_stay: "Saída anterior à entrada",
  payment_cross_unit: "Pagamento vinculado a outra unidade",
  unlinked_vehicle: "Placa sem vínculo cadastral",
  unpaid_exit: "Saída sem pagamento",
  unpaired_exit: "Saída sem entrada pareada",
  vip_without_revenue: "Entrada VIP sem geração de receita",
}

export function formatOperationalPlate(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

export function formatOperationalDateTime(value: string | null) {
  if (!value) {
    return "Não informado"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Não informado"
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatOperationalShortDateTime(value: string | null) {
  if (!value) {
    return "Não informado"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Não informado"
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  })
}

export function formatOperationalCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    currency: "BRL",
    style: "currency",
  })
}

export function formatOperationalInteger(value: number) {
  return value.toLocaleString("pt-BR")
}

export function formatOperationalPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "Não informada"
  }

  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}%`
}

export function formatOperationalStay(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "Não informado"
  }

  if (value < 60) {
    return `${Math.max(0, Math.round(value)).toLocaleString("pt-BR")} min`
  }

  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)

  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
}

export function getOperationalReadQuality(confidence: number | null): OperationalReadQuality {
  if (confidence === null || !Number.isFinite(confidence)) {
    return "unknown"
  }

  if (confidence >= 90) {
    return "high"
  }

  if (confidence >= 70) {
    return "medium"
  }

  return "low"
}

export function getOperationalCaptureStatusTone(status: OperationalCaptureStatus) {
  return status === "inconsistent" ? "destructive" as const : "outline" as const
}

export function getOperationalFinancialStatusTone(status: OperationalFinancialStatus) {
  if (status === "pending" || status === "lost_by_failure") {
    return "destructive" as const
  }

  return "outline" as const
}
