export type OperationalCameraType = "entrada" | "saida" | "unknown"

export type OperationalCaptureStatus =
  "open_entry" | "exit_read" | "paired" | "inconsistent"

export type OperationalRegistrationStatus = "linked" | "unlinked"

export type OperationalReadQuality = "high" | "medium" | "low" | "unknown"

export type OperationalIssueCode =
  | "negative_stay"
  | "missing_camera_type"
  | "missing_unit"
  | "unlinked_vehicle"
  | "low_confidence"
  | "missing_image"
  | "missing_timestamp"
  | "unpaired_exit"
  | "unpaid_exit"
  | "payment_cross_unit"
  | "manual_justification"
  | "vip_without_revenue"
  | "capture_failure_revenue_loss"

export type OperationalFinancialStatus =
  | "chargeable"
  | "paid"
  | "pending"
  | "exempt_vip"
  | "benefit"
  | "justified_exit"
  | "lost_by_failure"
  | "paid_elsewhere"

export type OperationalFinancialReason =
  | "standard_charge"
  | "vip_client"
  | "vip_vehicle"
  | "fuel_benefit"
  | "manual_justification"
  | "unpaid_exit"
  | "cross_unit_payment"
  | "camera_failure"
  | "network_failure"
  | "unpaired_capture"

export interface OperationalCaptureSourceRow {
  seq_captura: number | string
  num_placa: string
  des_marca?: string | null
  des_cor?: string | null
  dta_entrada?: string | null
  dta_saida?: string | null
  seq_placa?: number | string | null
  seq_unidade?: number | string | null
  ind_status?: boolean | null
  des_camera?: string | null
  des_tipo_camera?: string | null
  hra_entrada?: string | null
  hra_saida?: string | null
  hra_criacao?: string | null
  hra_alteracao?: string | null
  confianca?: number | string | null
  ts_entrada?: string | null
  ts_saida?: string | null
  unit_id?: string | number | null
  unit_name?: string | null
  unit_capacity?: number | string | null
  matched_entry_sequence?: number | string | null
  matched_exit_sequence?: number | string | null
  has_vehicle_image?: boolean | null
  has_plate_image?: boolean | null
  storage_url?: string | null
  storage_placa_url?: string | null
}

export interface OperationalFinancialSourceRow {
  id: string
  session_id?: string | null
  plate: string
  normalized_plate?: string | null
  client_id?: number | string | null
  client_name?: string | null
  vehicle_id?: number | string | null
  entry_capture_sequence?: number | string | null
  exit_capture_sequence?: number | string | null
  unit_id?: string | number | null
  unit_name?: string | null
  origin_unit_id?: string | number | null
  origin_unit_name?: string | null
  payment_unit_id?: string | number | null
  payment_unit_name?: string | null
  entry_at?: string | null
  exit_at?: string | null
  stay_minutes?: number | string | null
  status: string
  reason: string
  expected_amount?: number | string | null
  charged_amount?: number | string | null
  paid_amount?: number | string | null
  pending_amount?: number | string | null
  waived_amount?: number | string | null
  lost_amount?: number | string | null
  payment_reference_id?: string | null
  linked_settlement_id?: string | null
  price_table_id?: string | null
  rule_id?: string | null
  justification?: string | null
  created_at?: string | null
}

export interface OperationalCaptureEvent {
  id: string
  sequence: number
  plate: string
  normalizedPlate: string
  brand: string | null
  color: string | null
  unitId: string | null
  unitName: string
  legacyUnitId: string | null
  plateRecordId: string | null
  cameraName: string
  cameraType: OperationalCameraType
  cameraTypeLabel: string
  eventAt: string
  entryAt: string | null
  exitAt: string | null
  stayMinutes: number | null
  confidence: number | null
  quality: OperationalReadQuality
  qualityLabel: string
  status: OperationalCaptureStatus
  statusLabel: string
  registrationStatus: OperationalRegistrationStatus
  registrationStatusLabel: string
  hasVehicleImage: boolean
  hasPlateImage: boolean
  matchedEventId: string | null
  issueCodes: OperationalIssueCode[]
  issueLabels: string[]
}

export interface OperationalStayRecord {
  id: string
  plate: string
  normalizedPlate: string
  unitId: string | null
  unitName: string
  entryEventId: string
  exitEventId: string
  entryAt: string
  exitAt: string
  stayMinutes: number
  entryCameraName: string
  exitCameraName: string
  confidence: number | null
  issueCodes: OperationalIssueCode[]
  issueLabels: string[]
}

export interface OperationalFinancialRecord {
  id: string
  sessionId: string | null
  plate: string
  normalizedPlate: string
  clientId: string | null
  clientName: string
  vehicleId: string | null
  unitId: string | null
  unitName: string
  originUnitId: string | null
  originUnitName: string
  paymentUnitId: string | null
  paymentUnitName: string | null
  entryAt: string | null
  exitAt: string | null
  stayMinutes: number | null
  status: OperationalFinancialStatus
  statusLabel: string
  reason: OperationalFinancialReason
  reasonLabel: string
  expectedAmount: number
  chargedAmount: number
  paidAmount: number
  pendingAmount: number
  waivedAmount: number
  lostAmount: number
  paymentReferenceId: string | null
  linkedSettlementId: string | null
  priceTableId: string | null
  ruleId: string | null
  justification: string | null
  captureEventIds: string[]
  issueCodes: OperationalIssueCode[]
  issueLabels: string[]
  createdAt: string | null
}

export interface OperationalCapacitySnapshot {
  total: number
  occupied: number
  available: number
  occupancyPercent: number
  isConfigured: boolean
}

export interface OperationalFlowPoint {
  hour: string
  entries: number
  exits: number
}

export interface OperationalFinancialSummary {
  expectedRevenue: number
  realizedRevenue: number
  pendingRevenue: number
  waivedRevenue: number
  lostRevenue: number
  paidElsewhereRevenue: number
  vipWithoutRevenueCount: number
  pendingCount: number
}

export interface OperationalConfidenceByCamera {
  cameraName: string
  averageConfidence: number | null
  lowConfidenceReads: number
  reads: number
}

export interface OperationalStatusDistribution {
  status: OperationalCaptureStatus
  label: string
  count: number
}

export interface OperationalDashboardIndicator {
  id:
    | "vehicles-in-yard"
    | "occupancy"
    | "avg-stay"
    | "avg-confidence"
    | "divergences"
    | "pending-revenue"
    | "lost-revenue"
  label: string
  value: number
  unit: "count" | "currency" | "minutes" | "percent"
  hint: string
}

export interface OperationalDashboardAlert {
  id: string
  severity: "info" | "warning" | "critical"
  title: string
  description: string
  occurredAt: string
  eventId: string
}

export interface OperationalDashboardSnapshot {
  unitId: string | null
  unitName: string
  generatedAt: string
  period: {
    from: string | null
    to: string | null
  }
  hasFinancialSource: boolean
  capacity: OperationalCapacitySnapshot
  financialSummary: OperationalFinancialSummary
  indicators: OperationalDashboardIndicator[]
  events: OperationalCaptureEvent[]
  currentYard: OperationalCaptureEvent[]
  permanence: OperationalStayRecord[]
  financialRecords: OperationalFinancialRecord[]
  qualityEvents: OperationalCaptureEvent[]
  divergences: OperationalCaptureEvent[]
  recentMovements: OperationalCaptureEvent[]
  flowByHour: OperationalFlowPoint[]
  confidenceByCamera: OperationalConfidenceByCamera[]
  statusDistribution: OperationalStatusDistribution[]
  alerts: OperationalDashboardAlert[]
}
