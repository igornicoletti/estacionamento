import { clientsCopy } from "../constants"
import {
  type ClientSyncHistoryEntry,
  type ClientSyncMode,
  type ClientSyncStatus,
  type ClientSyncTrigger,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
  type TriggerClientsSyncResult,
} from "./clients-types"

type UnknownRecord = Record<PropertyKey, unknown>

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function readNullableString(value: unknown) {
  const text = readString(value)
  return text || null
}

export function readNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLocaleUpperCase("pt-BR")
    return normalized === "TRUE" || normalized === "S" || normalized === "SIM"
  }

  return Boolean(value)
}

function hasKeys(value: UnknownRecord, keys: readonly string[]) {
  return keys.every((key) => key in value)
}

export function parseRows<TPayload>(
  value: unknown,
  keys: readonly string[],
  errorMessage: string
): readonly TPayload[] {
  if (!Array.isArray(value)) {
    throw new Error(errorMessage)
  }

  return value.reduce<TPayload[]>((rows, row) => {
    if (isRecord(row) && hasKeys(row, keys)) {
      rows.push(row as TPayload)
    }

    return rows
  }, [])
}

export const clientPayloadKeys = [
  "cod_pessoa",
  "nom_pessoa",
  "nom_fantasia",
  "num_cnpj_cpf",
  "des_email_1",
  "num_telefone_1",
  "nom_cidade",
  "sgl_estado",
  "dta_cadastro",
  "ind_pessoa_ativa",
  "bloqueio_financeiro",
  "qtd_veiculos",
  "dta_ultima_compra",
] as const satisfies readonly (keyof ErpClientPayload)[]

export const clientVehiclePayloadKeys = [
  "cod_veiculo",
  "cod_pessoa",
  "nom_pessoa",
  "nom_fantasia",
  "num_cnpj_cpf",
  "num_placa",
  "des_veiculo",
  "nom_motorista",
] as const satisfies readonly (keyof ErpClientVehiclePayload)[]

export function parseClientRows(value: unknown) {
  return parseRows<ErpClientPayload>(
    value,
    clientPayloadKeys,
    clientsCopy.errors.invalidClientsResponse
  )
}

export function parseClientVehicleRows(value: unknown) {
  return parseRows<ErpClientVehiclePayload>(
    value,
    clientVehiclePayloadKeys,
    clientsCopy.errors.invalidClientsResponse
  )
}

export function isClientSyncMode(value: unknown): value is ClientSyncMode {
  return value === "full" || value === "incremental"
}

export function isClientSyncTrigger(value: unknown): value is ClientSyncTrigger {
  return value === "automatic" || value === "manual"
}

export function isClientSyncStatus(value: unknown): value is ClientSyncStatus {
  return value === "success" || value === "warning" || value === "failed"
}

function normalizeSyncMessage(message: unknown, status: ClientSyncStatus) {
  const text = readNullableString(message)

  if (text) {
    return text
  }

  return status === "success"
    ? clientsCopy.sync.feedback.success
    : clientsCopy.sync.feedback.error
}

function normalizeSyncErrorDetails(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

export function parseClientSyncHistoryEntry(value: unknown): ClientSyncHistoryEntry | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readNullableString(value.id)
  const mode = isClientSyncMode(value.mode) ? value.mode : null
  const trigger = isClientSyncTrigger(value.trigger) ? value.trigger : null
  const status = isClientSyncStatus(value.status) ? value.status : null
  const startedAt = readNullableString(value.started_at)
  const finishedAt = readNullableString(value.finished_at)

  if (!id || !mode || !trigger || !status || !startedAt) {
    return null
  }

  return {
    consecutiveFailures: readNumber(value.consecutive_failures),
    counters: {
      clientsCreated: readNumber(value.counters_clients_created),
      clientsFailed: readNumber(value.counters_clients_failed),
      clientsReceived: readNumber(value.counters_clients_received),
      clientsUnchanged: readNumber(value.counters_clients_unchanged),
      clientsUpdated: readNumber(value.counters_clients_updated),
      vehiclesCreated: readNumber(value.counters_vehicles_created),
      vehiclesFailed: readNumber(value.counters_vehicles_failed),
      vehiclesReceived: readNumber(value.counters_vehicles_received),
      vehiclesUnchanged: readNumber(value.counters_vehicles_unchanged),
      vehiclesUpdated: readNumber(value.counters_vehicles_updated),
    },
    durationSeconds: typeof value.duration_seconds === "number" ? value.duration_seconds : null,
    errorDetails: normalizeSyncErrorDetails(value.error_details),
    finishedAt,
    id,
    message: normalizeSyncMessage(value.message, status),
    mode,
    startedAt,
    status,
    trigger,
  }
}

export function parseClientSyncHistory(value: unknown): ClientSyncHistoryEntry[] {
  if (!Array.isArray(value)) {
    throw new Error(clientsCopy.errors.invalidSyncHistoryResponse)
  }

  const entries = value.map(parseClientSyncHistoryEntry)

  if (entries.some((entry) => entry === null)) {
    throw new Error(clientsCopy.errors.invalidSyncHistoryResponse)
  }

  return entries.filter((entry): entry is ClientSyncHistoryEntry => entry !== null)
}

export function parseTriggerClientsSyncResult(value: unknown): TriggerClientsSyncResult {
  if (!isRecord(value)) {
    throw new Error(clientsCopy.sync.feedback.error)
  }

  const status = isClientSyncStatus(value.status) ? value.status : "failed"
  const message = readNullableString(value.message) ?? clientsCopy.sync.feedback.error
  const runId = readNullableString(value.runId)

  return { message, runId, status }
}
