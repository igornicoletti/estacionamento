import {
  formatOperationalPlate,
  getOperationalReadQuality,
  operationalCameraTypeLabels,
  operationalCaptureStatusLabels,
  operationalFinancialReasonLabels,
  operationalFinancialStatusLabels,
  operationalIssueLabels,
  operationalReadQualityLabels,
  operationalRegistrationStatusLabels,
} from "./operations-formatters"
import {
  type OperationalCapacitySnapshot,
  type OperationalCaptureEvent,
  type OperationalCaptureSourceRow,
  type OperationalCaptureStatus,
  type OperationalConfidenceByCamera,
  type OperationalDashboardAlert,
  type OperationalDashboardIndicator,
  type OperationalDashboardSnapshot,
  type OperationalFinancialReason,
  type OperationalFinancialRecord,
  type OperationalFinancialSourceRow,
  type OperationalFinancialStatus,
  type OperationalFinancialSummary,
  type OperationalFlowPoint,
  type OperationalIssueCode,
  type OperationalStatusDistribution,
  type OperationalStayRecord,
} from "./operations-types"

const LOW_CONFIDENCE_LIMIT = 70
const FALLBACK_UNIT_NAME = "Unidade não informada"

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readNullableString(value: unknown) {
  const text = readString(value)
  return text ? text : null
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = Number(value.replace(",", "."))
    return Number.isFinite(normalized) ? normalized : null
  }

  return null
}

function readMoney(value: unknown) {
  return Math.max(0, readNumber(value) ?? 0)
}

function readId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  return null
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null
}

function normalizeTimestamp(value: unknown) {
  const text = readString(value)

  if (!text) {
    return null
  }

  const normalized = text
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00")
  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeLegacyLocalTimestamp(dateValue: unknown, timeValue: unknown) {
  const date = readString(dateValue)

  if (!date) {
    return null
  }

  const rawTime = readString(timeValue)
  const time = rawTime ? rawTime.slice(0, 8) : "00:00:00"

  return normalizeTimestamp(`${date}T${time}-03:00`)
}

function normalizeCameraType(value: unknown) {
  const normalized = readString(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

  if (normalized === "entrada") {
    return "entrada" as const
  }

  if (normalized === "saida") {
    return "saida" as const
  }

  return "unknown" as const
}

function normalizeConfidence(value: unknown) {
  const parsed = readNumber(value)

  if (parsed === null) {
    return null
  }

  return Math.max(0, Math.min(100, parsed))
}

function getMinutesBetween(start: string | null, end: string | null) {
  if (!start || !end) {
    return null
  }

  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()

  if (
    Number.isNaN(startTime) ||
    Number.isNaN(endTime) ||
    endTime < startTime
  ) {
    return null
  }

  return Math.round((endTime - startTime) / 60000)
}

function hasNegativeStay(entryAt: string | null, exitAt: string | null) {
  if (!entryAt || !exitAt) {
    return false
  }

  const entryTime = new Date(entryAt).getTime()
  const exitTime = new Date(exitAt).getTime()

  return !Number.isNaN(entryTime) && !Number.isNaN(exitTime) && exitTime < entryTime
}

function getEventTime(input: {
  cameraType: OperationalCaptureEvent["cameraType"]
  entryAt: string | null
  exitAt: string | null
}) {
  const { cameraType, entryAt, exitAt } = input

  if (cameraType === "saida") {
    return exitAt ?? entryAt ?? ""
  }

  if (cameraType === "entrada") {
    return entryAt ?? exitAt ?? ""
  }

  return entryAt ?? exitAt ?? ""
}

function getInitialStatus(input: {
  active: boolean | null
  cameraType: OperationalCaptureEvent["cameraType"]
  entryAt: string | null
  eventAt: string
  exitAt: string | null
  negativeStay: boolean
}): OperationalCaptureStatus {
  const { active, cameraType, entryAt, eventAt, exitAt, negativeStay } = input

  if (negativeStay || !eventAt || cameraType === "unknown") {
    return "inconsistent"
  }

  if (cameraType === "saida") {
    return "exit_read"
  }

  if (cameraType === "entrada" && entryAt && exitAt) {
    return "paired"
  }

  if (cameraType === "entrada" && (active ?? true)) {
    return "open_entry"
  }

  return "open_entry"
}

function getBaseIssues(input: {
  cameraType: OperationalCaptureEvent["cameraType"]
  confidence: number | null
  eventAt: string
  hasAnyImage: boolean
  negativeStay: boolean
  plateRecordId: string | null
  unitId: string | null
}) {
  const issues: OperationalIssueCode[] = []

  if (input.negativeStay) {
    issues.push("negative_stay")
  }

  if (input.cameraType === "unknown") {
    issues.push("missing_camera_type")
  }

  if (!input.eventAt) {
    issues.push("missing_timestamp")
  }

  if (!input.unitId) {
    issues.push("missing_unit")
  }

  if (!input.plateRecordId) {
    issues.push("unlinked_vehicle")
  }

  if (input.confidence !== null && input.confidence < LOW_CONFIDENCE_LIMIT) {
    issues.push("low_confidence")
  }

  if (!input.hasAnyImage) {
    issues.push("missing_image")
  }

  return issues
}

function uniqueIssueCodes(issueCodes: readonly OperationalIssueCode[]) {
  return Array.from(new Set(issueCodes))
}

function issueLabels(issueCodes: readonly OperationalIssueCode[]) {
  return issueCodes.map((code) => operationalIssueLabels[code])
}

function addIssue(event: OperationalCaptureEvent, issueCode: OperationalIssueCode) {
  if (event.issueCodes.includes(issueCode)) {
    return event
  }

  const issueCodes = uniqueIssueCodes([...event.issueCodes, issueCode])

  return {
    ...event,
    issueCodes,
    issueLabels: issueLabels(issueCodes),
  }
}

function updateEventPair(input: {
  event: OperationalCaptureEvent
  matchedEventId: string
  stayMinutes: number
}) {
  const { event, matchedEventId, stayMinutes } = input

  return {
    ...event,
    matchedEventId,
    status: "paired" as const,
    statusLabel: operationalCaptureStatusLabels.paired,
    stayMinutes,
  }
}

function createStayRecord(input: {
  entry: OperationalCaptureEvent
  exit: OperationalCaptureEvent
  stayMinutes: number
}): OperationalStayRecord {
  const { entry, exit, stayMinutes } = input
  const confidenceValues = [entry.confidence, exit.confidence].filter(
    (value): value is number => value !== null
  )
  const confidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, value) => sum + value, 0) /
        confidenceValues.length
      : null
  const issueCodes = uniqueIssueCodes([
    ...entry.issueCodes.filter((code) => code !== "unpaired_exit"),
    ...exit.issueCodes.filter((code) => code !== "unpaired_exit"),
  ])

  return {
    confidence,
    entryAt: entry.entryAt ?? entry.eventAt,
    entryCameraName: entry.cameraName,
    entryEventId: entry.id,
    exitAt: exit.exitAt ?? exit.eventAt,
    exitCameraName: exit.cameraName,
    exitEventId: exit.id,
    id: `${entry.id}:${exit.id}`,
    issueCodes,
    issueLabels: issueLabels(issueCodes),
    normalizedPlate: entry.normalizedPlate,
    plate: entry.plate,
    stayMinutes,
    unitId: entry.unitId ?? exit.unitId,
    unitName:
      entry.unitName !== FALLBACK_UNIT_NAME ? entry.unitName : exit.unitName,
  }
}

function canPairEvents(entry: OperationalCaptureEvent, exit: OperationalCaptureEvent) {
  if (
    entry.cameraType !== "entrada" ||
    exit.cameraType !== "saida" ||
    !entry.entryAt ||
    !exit.exitAt ||
    !entry.normalizedPlate ||
    entry.normalizedPlate !== exit.normalizedPlate
  ) {
    return false
  }

  if (entry.unitId && exit.unitId && entry.unitId !== exit.unitId) {
    return false
  }

  return new Date(exit.exitAt).getTime() >= new Date(entry.entryAt).getTime()
}

function getPairKey(event: OperationalCaptureEvent) {
  return `${event.normalizedPlate}|${event.unitId ?? ""}`
}

function sortByEventTimeAsc(left: OperationalCaptureEvent, right: OperationalCaptureEvent) {
  return new Date(left.eventAt || 0).getTime() - new Date(right.eventAt || 0).getTime()
}

function sortByEventTimeDesc(left: OperationalCaptureEvent, right: OperationalCaptureEvent) {
  return new Date(right.eventAt || 0).getTime() - new Date(left.eventAt || 0).getTime()
}

function findPairableEntryIndex(
  entries: readonly OperationalCaptureEvent[],
  exit: OperationalCaptureEvent
) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (canPairEvents(entries[index], exit)) {
      return index
    }
  }

  return -1
}

function pairOperationalCaptureEvents(events: readonly OperationalCaptureEvent[]) {
  const eventsById = new Map(events.map((event) => [event.id, { ...event }]))
  const pairedIds = new Set<string>()
  const permanence: OperationalStayRecord[] = []

  for (const event of eventsById.values()) {
    if (
      event.status === "paired" &&
      event.entryAt &&
      event.exitAt &&
      event.stayMinutes !== null
    ) {
      permanence.push(createStayRecord({
        entry: event,
        exit: event,
        stayMinutes: event.stayMinutes,
      }))
      pairedIds.add(event.id)
    }
  }

  const openEntriesByKey = new Map<string, OperationalCaptureEvent[]>()

  for (const event of Array.from(eventsById.values()).sort(sortByEventTimeAsc)) {
    if (pairedIds.has(event.id) || event.status === "inconsistent") {
      continue
    }

    if (event.cameraType === "entrada") {
      const key = getPairKey(event)
      const entries = openEntriesByKey.get(key) ?? []
      entries.push(event)
      openEntriesByKey.set(key, entries)
      continue
    }

    if (event.cameraType !== "saida") {
      continue
    }

    const key = getPairKey(event)
    const entries = openEntriesByKey.get(key) ?? []
    const entryIndex = findPairableEntryIndex(entries, event)

    if (entryIndex === -1) {
      eventsById.set(event.id, addIssue(event, "unpaired_exit"))
      continue
    }

    const [entry] = entries.splice(entryIndex, 1)
    const stayMinutes = getMinutesBetween(entry.entryAt, event.exitAt)

    if (stayMinutes === null) {
      eventsById.set(event.id, addIssue(event, "negative_stay"))
      continue
    }

    const pairedEntry = updateEventPair({
      event: entry,
      matchedEventId: event.id,
      stayMinutes,
    })
    const pairedExit = updateEventPair({
      event,
      matchedEventId: entry.id,
      stayMinutes,
    })

    eventsById.set(entry.id, pairedEntry)
    eventsById.set(event.id, pairedExit)
    pairedIds.add(entry.id)
    pairedIds.add(event.id)
    permanence.push(createStayRecord({
      entry: pairedEntry,
      exit: pairedExit,
      stayMinutes,
    }))
  }

  return {
    events: Array.from(eventsById.values()).sort(sortByEventTimeDesc),
    permanence: permanence.sort((left, right) =>
      new Date(right.exitAt).getTime() - new Date(left.exitAt).getTime()
    ),
  }
}

function isFinancialStatus(value: string): value is OperationalFinancialStatus {
  return value in operationalFinancialStatusLabels
}

function isFinancialReason(value: string): value is OperationalFinancialReason {
  return value in operationalFinancialReasonLabels
}

function normalizeFinancialStatus(value: unknown): OperationalFinancialStatus {
  const normalized = readString(value)

  return isFinancialStatus(normalized) ? normalized : "pending"
}

function normalizeFinancialReason(value: unknown): OperationalFinancialReason {
  const normalized = readString(value)

  return isFinancialReason(normalized) ? normalized : "unpaired_capture"
}

function getFinancialIssues(input: {
  status: OperationalFinancialStatus
  reason: OperationalFinancialReason
}) {
  const issues: OperationalIssueCode[] = []

  if (input.status === "pending" || input.reason === "unpaid_exit") {
    issues.push("unpaid_exit")
  }

  if (input.status === "paid_elsewhere" || input.reason === "cross_unit_payment") {
    issues.push("payment_cross_unit")
  }

  if (input.status === "justified_exit" || input.reason === "manual_justification") {
    issues.push("manual_justification")
  }

  if (input.status === "exempt_vip" || input.reason === "vip_client" || input.reason === "vip_vehicle") {
    issues.push("vip_without_revenue")
  }

  if (input.status === "lost_by_failure" || input.reason === "camera_failure" || input.reason === "network_failure") {
    issues.push("capture_failure_revenue_loss")
  }

  return uniqueIssueCodes(issues)
}

function captureEventIdFromSequence(value: unknown) {
  const id = readId(value)

  return id ? `capture:${id}` : null
}

export function normalizeOperationalCaptureSourceRow(
  row: OperationalCaptureSourceRow,
  fallbackUnitName = FALLBACK_UNIT_NAME
): OperationalCaptureEvent {
  const sequence = readNumber(row.seq_captura) ?? 0
  const plate = formatOperationalPlate(readString(row.num_placa))
  const cameraType = normalizeCameraType(row.des_tipo_camera)
  const entryAt =
    normalizeTimestamp(row.ts_entrada) ??
    normalizeLegacyLocalTimestamp(row.dta_entrada, row.hra_entrada ?? row.hra_criacao)
  const exitAt =
    normalizeTimestamp(row.ts_saida) ??
    normalizeLegacyLocalTimestamp(
      row.dta_saida,
      row.hra_saida ?? row.hra_alteracao ?? row.hra_criacao
    )
  const eventAt = getEventTime({ cameraType, entryAt, exitAt })
  const confidence = normalizeConfidence(row.confianca)
  const quality = getOperationalReadQuality(confidence)
  const plateRecordId = readId(row.seq_placa)
  const unitId = readId(row.unit_id ?? row.seq_unidade)
  const legacyUnitId = readId(row.seq_unidade)
  const hasVehicleImage = Boolean(row.has_vehicle_image ?? readNullableString(row.storage_url))
  const hasPlateImage = Boolean(row.has_plate_image ?? readNullableString(row.storage_placa_url))
  const negativeStay = hasNegativeStay(entryAt, exitAt)
  const status = getInitialStatus({
    active: readBoolean(row.ind_status),
    cameraType,
    entryAt,
    eventAt,
    exitAt,
    negativeStay,
  })
  const issueCodes = uniqueIssueCodes(getBaseIssues({
    cameraType,
    confidence,
    eventAt,
    hasAnyImage: hasVehicleImage || hasPlateImage,
    negativeStay,
    plateRecordId,
    unitId,
  }))
  const matchedEventId = readId(
    cameraType === "entrada"
      ? row.matched_exit_sequence
      : row.matched_entry_sequence
  )

  return {
    brand: readNullableString(row.des_marca),
    cameraName: readNullableString(row.des_camera) ?? "Câmera não informada",
    cameraType,
    cameraTypeLabel: operationalCameraTypeLabels[cameraType],
    color: readNullableString(row.des_cor),
    confidence,
    entryAt,
    eventAt,
    exitAt,
    hasPlateImage,
    hasVehicleImage,
    id: `capture:${sequence}`,
    issueCodes,
    issueLabels: issueLabels(issueCodes),
    legacyUnitId,
    matchedEventId: matchedEventId ? `capture:${matchedEventId}` : null,
    normalizedPlate: plate,
    plate,
    plateRecordId,
    quality,
    qualityLabel: operationalReadQualityLabels[quality],
    registrationStatus: plateRecordId ? "linked" : "unlinked",
    registrationStatusLabel: plateRecordId
      ? operationalRegistrationStatusLabels.linked
      : operationalRegistrationStatusLabels.unlinked,
    sequence,
    status,
    statusLabel: operationalCaptureStatusLabels[status],
    stayMinutes: getMinutesBetween(entryAt, exitAt),
    unitId,
    unitName: readNullableString(row.unit_name) ?? fallbackUnitName,
  }
}

export function normalizeOperationalFinancialSourceRow(
  row: OperationalFinancialSourceRow,
  fallbackUnitName = FALLBACK_UNIT_NAME
): OperationalFinancialRecord {
  const status = normalizeFinancialStatus(row.status)
  const reason = normalizeFinancialReason(row.reason)
  const issueCodes = getFinancialIssues({ reason, status })
  const entryCaptureId = captureEventIdFromSequence(row.entry_capture_sequence)
  const exitCaptureId = captureEventIdFromSequence(row.exit_capture_sequence)

  return {
    captureEventIds: [entryCaptureId, exitCaptureId].filter(
      (value): value is string => Boolean(value)
    ),
    chargedAmount: readMoney(row.charged_amount),
    clientId: readId(row.client_id),
    clientName: readNullableString(row.client_name) ?? "Cliente não vinculado",
    createdAt: normalizeTimestamp(row.created_at),
    entryAt: normalizeTimestamp(row.entry_at),
    expectedAmount: readMoney(row.expected_amount),
    exitAt: normalizeTimestamp(row.exit_at),
    id: readString(row.id),
    issueCodes,
    issueLabels: issueLabels(issueCodes),
    justification: readNullableString(row.justification),
    linkedSettlementId: readNullableString(row.linked_settlement_id),
    lostAmount: readMoney(row.lost_amount),
    normalizedPlate: formatOperationalPlate(row.normalized_plate ?? row.plate),
    originUnitId: readId(row.origin_unit_id ?? row.unit_id),
    originUnitName: readNullableString(row.origin_unit_name ?? row.unit_name) ?? fallbackUnitName,
    paidAmount: readMoney(row.paid_amount),
    paymentReferenceId: readNullableString(row.payment_reference_id),
    paymentUnitId: readId(row.payment_unit_id),
    paymentUnitName: readNullableString(row.payment_unit_name),
    pendingAmount: readMoney(row.pending_amount),
    plate: formatOperationalPlate(row.plate),
    priceTableId: readNullableString(row.price_table_id),
    reason,
    reasonLabel: operationalFinancialReasonLabels[reason],
    ruleId: readNullableString(row.rule_id),
    sessionId: readNullableString(row.session_id),
    status,
    statusLabel: operationalFinancialStatusLabels[status],
    stayMinutes: readNumber(row.stay_minutes),
    unitId: readId(row.unit_id),
    unitName: readNullableString(row.unit_name) ?? fallbackUnitName,
    vehicleId: readId(row.vehicle_id),
    waivedAmount: readMoney(row.waived_amount),
  }
}

function formatHour(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Sem hora"
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).replace(/:\d{2}$/, ":00")
}

function groupFlowByHour(events: readonly OperationalCaptureEvent[]) {
  const points = new Map<string, OperationalFlowPoint>()

  function add(hour: string, key: "entries" | "exits") {
    const point = points.get(hour) ?? { entries: 0, exits: 0, hour }
    point[key] += 1
    points.set(hour, point)
  }

  for (const event of events) {
    if (event.cameraType === "entrada" && event.entryAt) {
      add(formatHour(event.entryAt), "entries")
    }

    if (event.cameraType === "saida" && event.exitAt) {
      add(formatHour(event.exitAt), "exits")
    }

    if (event.cameraType === "entrada" && event.exitAt) {
      add(formatHour(event.exitAt), "exits")
    }
  }

  return Array.from(points.values()).sort((left, right) =>
    left.hour.localeCompare(right.hour, "pt-BR", { numeric: true })
  )
}

function getConfidenceByCamera(events: readonly OperationalCaptureEvent[]) {
  const grouped = new Map<string, { confidenceTotal: number; knownConfidenceReads: number; low: number; reads: number }>()

  for (const event of events) {
    const current = grouped.get(event.cameraName) ?? {
      confidenceTotal: 0,
      knownConfidenceReads: 0,
      low: 0,
      reads: 0,
    }

    current.reads += 1

    if (event.confidence !== null) {
      current.confidenceTotal += event.confidence
      current.knownConfidenceReads += 1
      if (event.confidence < LOW_CONFIDENCE_LIMIT) {
        current.low += 1
      }
    }

    grouped.set(event.cameraName, current)
  }

  return Array.from(grouped.entries())
    .map<OperationalConfidenceByCamera>(([cameraName, value]) => ({
      averageConfidence:
        value.knownConfidenceReads > 0
          ? Math.round((value.confidenceTotal / value.knownConfidenceReads) * 10) / 10
          : null,
      cameraName,
      lowConfidenceReads: value.low,
      reads: value.reads,
    }))
    .sort((left, right) => right.reads - left.reads)
}

function getStatusDistribution(events: readonly OperationalCaptureEvent[]) {
  const counts = new Map<OperationalCaptureStatus, number>()

  for (const event of events) {
    counts.set(event.status, (counts.get(event.status) ?? 0) + 1)
  }

  return (Object.keys(operationalCaptureStatusLabels) as OperationalCaptureStatus[])
    .map<OperationalStatusDistribution>((status) => ({
      count: counts.get(status) ?? 0,
      label: operationalCaptureStatusLabels[status],
      status,
    }))
    .filter((item) => item.count > 0)
}

function getCapacity(input: {
  capacity: number | null
  occupied: number
}): OperationalCapacitySnapshot {
  const configuredCapacity =
    input.capacity !== null && input.capacity > 0 ? Math.round(input.capacity) : 0
  const total = configuredCapacity > 0
    ? Math.max(configuredCapacity, input.occupied)
    : input.occupied
  const available = Math.max(total - input.occupied, 0)

  return {
    available,
    isConfigured: configuredCapacity > 0,
    occupied: input.occupied,
    occupancyPercent:
      total > 0 ? Math.min(100, Math.round((input.occupied / total) * 100)) : 0,
    total,
  }
}

function getAverage(values: readonly number[]) {
  if (values.length === 0) {
    return 0
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  )
}

function getFinancialSummary(
  records: readonly OperationalFinancialRecord[]
): OperationalFinancialSummary {
  return records.reduce<OperationalFinancialSummary>((summary, record) => ({
    expectedRevenue: summary.expectedRevenue + record.expectedAmount,
    lostRevenue: summary.lostRevenue + record.lostAmount,
    paidElsewhereRevenue:
      summary.paidElsewhereRevenue +
      (record.status === "paid_elsewhere" ? record.paidAmount : 0),
    pendingCount:
      summary.pendingCount + (record.status === "pending" ? 1 : 0),
    pendingRevenue: summary.pendingRevenue + record.pendingAmount,
    realizedRevenue: summary.realizedRevenue + record.paidAmount,
    vipWithoutRevenueCount:
      summary.vipWithoutRevenueCount +
      (record.status === "exempt_vip" ? 1 : 0),
    waivedRevenue: summary.waivedRevenue + record.waivedAmount,
  }), {
    expectedRevenue: 0,
    lostRevenue: 0,
    paidElsewhereRevenue: 0,
    pendingCount: 0,
    pendingRevenue: 0,
    realizedRevenue: 0,
    vipWithoutRevenueCount: 0,
    waivedRevenue: 0,
  })
}

function getIndicators(input: {
  capacity: OperationalCapacitySnapshot
  divergences: readonly OperationalCaptureEvent[]
  events: readonly OperationalCaptureEvent[]
  financialSummary: OperationalFinancialSummary
  hasFinancialSource: boolean
  permanence: readonly OperationalStayRecord[]
}): OperationalDashboardIndicator[] {
  const confidenceValues = input.events
    .map((event) => event.confidence)
    .filter((value): value is number => value !== null)

  return [
    {
      hint: "Entradas abertas sem saída pareada.",
      id: "vehicles-in-yard",
      label: "Veículos no pátio",
      unit: "count",
      value: input.capacity.occupied,
    },
    {
      hint: input.capacity.isConfigured
        ? "Calculada sobre a capacidade configurada da unidade."
        : "Capacidade ainda não configurada para a unidade.",
      id: "occupancy",
      label: "Ocupação",
      unit: "percent",
      value: input.capacity.occupancyPercent,
    },
    {
      hint: "Média dos pareamentos confirmados no período.",
      id: "avg-stay",
      label: "Permanência média",
      unit: "minutes",
      value: getAverage(input.permanence.map((item) => item.stayMinutes)),
    },
    {
      hint: "Média de confiança das leituras LPR/OCR.",
      id: "avg-confidence",
      label: "Confiança média",
      unit: "percent",
      value: getAverage(confidenceValues),
    },
    {
      hint: "Registros com dados incompletos, não pareados ou inconsistentes.",
      id: "divergences",
      label: "Divergências",
      unit: "count",
      value: input.divergences.length,
    },
    {
      hint: input.hasFinancialSource
        ? "Pendências financeiras entregues pela fonte operacional."
        : "Fonte financeira operacional ainda não conectada.",
      id: "pending-revenue",
      label: "Receita pendente",
      unit: "currency",
      value: input.financialSummary.pendingRevenue,
    },
    {
      hint: input.hasFinancialSource
        ? "Estimativa de receita não capturada por falha operacional."
        : "Fonte financeira operacional ainda não conectada.",
      id: "lost-revenue",
      label: "Perda estimada",
      unit: "currency",
      value: input.financialSummary.lostRevenue,
    },
  ]
}

function getAlertSeverity(issueCodes: readonly OperationalIssueCode[]): OperationalDashboardAlert["severity"] {
  if (
    issueCodes.includes("negative_stay") ||
    issueCodes.includes("missing_unit") ||
    issueCodes.includes("capture_failure_revenue_loss")
  ) {
    return "critical"
  }

  if (
    issueCodes.includes("unpaired_exit") ||
    issueCodes.includes("missing_camera_type") ||
    issueCodes.includes("low_confidence") ||
    issueCodes.includes("unpaid_exit")
  ) {
    return "warning"
  }

  return "info"
}

function getCaptureAlerts(events: readonly OperationalCaptureEvent[]) {
  return events
    .filter((event) => event.issueCodes.length > 0)
    .map<OperationalDashboardAlert>((event) => ({
      description: event.issueLabels.join(", "),
      eventId: event.id,
      id: `capture-alert:${event.id}`,
      occurredAt: event.eventAt,
      severity: getAlertSeverity(event.issueCodes),
      title: `${event.plate} - ${event.cameraTypeLabel}`,
    }))
}

function getFinancialAlerts(records: readonly OperationalFinancialRecord[]) {
  return records
    .filter((record) => record.issueCodes.length > 0)
    .map<OperationalDashboardAlert>((record) => ({
      description: record.issueLabels.join(", "),
      eventId: record.id,
      id: `financial-alert:${record.id}`,
      occurredAt: record.exitAt ?? record.entryAt ?? record.createdAt ?? "",
      severity: getAlertSeverity(record.issueCodes),
      title: `${record.plate} - ${record.statusLabel}`,
    }))
}

function resolveSnapshotPeriod(events: readonly OperationalCaptureEvent[]) {
  const dates = events
    .map((event) => event.eventAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => left - right)
  const lastDate = dates[dates.length - 1]

  return {
    from: dates[0] ? new Date(dates[0]).toISOString() : null,
    to: lastDate ? new Date(lastDate).toISOString() : null,
  }
}

export function buildOperationalDashboardSnapshot(input: {
  captureRows: readonly OperationalCaptureSourceRow[]
  financialRows?: readonly OperationalFinancialSourceRow[]
  unitId: string | null
  unitName: string
  capacity?: number | null
  generatedAt?: string
}): OperationalDashboardSnapshot {
  const fallbackCapacity =
    input.capacity ??
    input.captureRows
      .map((row) => readNumber(row.unit_capacity))
      .find((value): value is number => value !== null) ??
    null
  const normalizedEvents = input.captureRows.map((row) =>
    normalizeOperationalCaptureSourceRow(row, input.unitName)
  )
  const { events, permanence } = pairOperationalCaptureEvents(normalizedEvents)
  const currentYard = events.filter((event) => event.status === "open_entry")
  const divergences = events.filter(
    (event) => event.status === "inconsistent" || event.issueCodes.length > 0
  )
  const financialRecords = (input.financialRows ?? []).map((row) =>
    normalizeOperationalFinancialSourceRow(row, input.unitName)
  )
  const financialSummary = getFinancialSummary(financialRecords)
  const capacity = getCapacity({
    capacity: fallbackCapacity,
    occupied: currentYard.length,
  })
  const alerts = [...getCaptureAlerts(divergences), ...getFinancialAlerts(financialRecords)]
    .filter((alert) => alert.occurredAt)
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 8)
  const hasFinancialSource = Boolean(input.financialRows)

  return {
    alerts,
    capacity,
    confidenceByCamera: getConfidenceByCamera(events),
    currentYard,
    divergences,
    events,
    financialRecords,
    financialSummary,
    flowByHour: groupFlowByHour(events),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    hasFinancialSource,
    indicators: getIndicators({
      capacity,
      divergences,
      events,
      financialSummary,
      hasFinancialSource,
      permanence,
    }),
    permanence,
    period: resolveSnapshotPeriod(events),
    qualityEvents: events,
    recentMovements: events.slice(0, 8),
    statusDistribution: getStatusDistribution(events),
    unitId: input.unitId,
    unitName: input.unitName,
  }
}
