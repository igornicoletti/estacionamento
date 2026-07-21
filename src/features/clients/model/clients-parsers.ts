import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENT_SYNC_FAILED_STATUS,
  CLIENT_SYNC_RUN_MODES,
  CLIENT_SYNC_STATUSES,
  CLIENT_SYNC_TRIGGERS,
} from "../constants/clients-sync"
import {
  type ClientSyncMode,
  type ClientSyncStatus,
  type ClientSyncTrigger,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
  type ParseIssue,
  type ParseRowsResult,
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

  if (typeof value === "number") {
    return value === 1
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLocaleUpperCase("pt-BR")
    return ["1", "TRUE", "S", "SIM", "Y", "YES", "ATIVO", "ACTIVE"].includes(normalized)
  }

  return false
}

function getMissingKeys(value: UnknownRecord, keys: readonly string[]) {
  return keys.filter((key) => !(key in value))
}

export function parseRowsWithIssues<TPayload>(
  value: unknown,
  keys: readonly string[],
  errorMessage: string
): ParseRowsResult<TPayload> {
  if (!Array.isArray(value)) {
    throw new Error(errorMessage)
  }

  const rows: TPayload[] = []
  const issues: ParseIssue[] = []

  value.forEach((row, index) => {
    if (!isRecord(row)) {
      issues.push({ index, missingKeys: [], reason: "row_not_object" })
      return
    }

    const missingKeys = getMissingKeys(row, keys)

    if (missingKeys.length > 0) {
      issues.push({ index, missingKeys, reason: "missing_required_keys" })
      return
    }

    rows.push(row as TPayload)
  })

  return {
    rows,
    rejectedRows: issues.length,
    issues,
  }
}

export function parseRows<TPayload>(
  value: unknown,
  keys: readonly string[],
  errorMessage: string
): readonly TPayload[] {
  const result = parseRowsWithIssues<TPayload>(value, keys, errorMessage)

  if (result.rejectedRows > 0) {
    throw new Error(`${errorMessage} ${result.rejectedRows} registro(s) rejeitado(s).`)
  }

  return result.rows
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
    clientsCopy.errors.invalidVehiclesResponse
  )
}

export function isClientSyncMode(value: unknown): value is ClientSyncMode {
  return (CLIENT_SYNC_RUN_MODES as readonly unknown[]).includes(value)
}

export function isClientSyncTrigger(value: unknown): value is ClientSyncTrigger {
  return (CLIENT_SYNC_TRIGGERS as readonly unknown[]).includes(value)
}

export function isClientSyncStatus(value: unknown): value is ClientSyncStatus {
  return (CLIENT_SYNC_STATUSES as readonly unknown[]).includes(value)
}

export function parseTriggerClientsSyncResult(value: unknown): TriggerClientsSyncResult {
  if (!isRecord(value)) {
    throw new Error(clientsCopy.sync.feedback.error)
  }

  const status = isClientSyncStatus(value.status) ? value.status : CLIENT_SYNC_FAILED_STATUS
  const message = readNullableString(value.message) ?? clientsCopy.sync.feedback.error
  const runId = readNullableString(value.runId)

  return { message, runId, status }
}
