const FALLBACK_ERROR_DETAIL =
  "Falha ao processar um item da sincronização."

const reasonLabels: Record<string, string> = {
  client_sync_run_insert_failed: "Não foi possível registrar o histórico da sincronização.",
  client_vehicles_upsert_failed: "Não foi possível salvar parte dos veículos sincronizados.",
  clients_upsert_failed: "Não foi possível salvar parte dos clientes sincronizados.",
  database_error: "Não foi possível salvar parte dos dados sincronizados.",
  invalid_payload: "Alguns registros recebidos estavam incompletos.",
  invalid_record: "Alguns registros recebidos estavam incompletos.",
  missing_client: "Cliente vinculado não foi encontrado.",
  network_error: "Não foi possível consultar o ERP durante a sincronização.",
  request_failed: "Não foi possível concluir a comunicação com o ERP.",
  timeout: "O ERP demorou mais que o esperado para responder.",
  sync_lock_error: "Não foi possível reservar a execução da sincronização.",
  unit_sync_run_insert_failed: "Não foi possível registrar o histórico da sincronização.",
  units_upsert_failed: "Não foi possível salvar parte das unidades sincronizadas.",
  validation_error: "Alguns registros recebidos não passaram pela validação.",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeReasonText(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const reasonKey = normalized.toLowerCase().replaceAll("-", "_")
  const mappedLabel = reasonLabels[reasonKey]

  if (mappedLabel) {
    return mappedLabel
  }

  if (/timeout|timed?\s*out|demorou/i.test(normalized)) {
    return reasonLabels.timeout
  }

  if (/network|fetch|erp|conex[aã]o|request/i.test(normalized)) {
    return reasonLabels.network_error
  }

  if (/database|insert|update|upsert|permission|policy|rls/i.test(normalized)) {
    return reasonLabels.database_error
  }

  if (/invalid|missing|required|schema|payload|validation/i.test(normalized)) {
    return reasonLabels.validation_error
  }

  return FALLBACK_ERROR_DETAIL
}

function extractDetailTexts(value: unknown): string[] {
  if (typeof value === "string") {
    const normalized = normalizeReasonText(value)

    return normalized ? [normalized] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractDetailTexts)
  }

  if (!isRecord(value)) {
    return []
  }

  const candidates = [
    value.reason,
    value.message,
    value.detail,
    value.error,
    value.code,
  ]

  return candidates.flatMap(extractDetailTexts)
}

export function normalizeSyncErrorDetails(value: unknown) {
  const details = extractDetailTexts(value)
  const uniqueDetails = Array.from(new Set(details))

  return uniqueDetails.length > 0 ? uniqueDetails : []
}

export function normalizeSyncHistoryMessage(message: string, status: "success" | "warning" | "failed") {
  if (status !== "failed") {
    return message
  }

  const mappedMessage = normalizeReasonText(message)

  return mappedMessage ?? "A sincronização não foi concluída."
}
