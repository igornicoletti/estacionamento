import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export type UnitSyncMode = "full" | "incremental"

interface TriggerUnitsSyncResult {
  runId: string | null
  status: "success" | "warning" | "failed"
  message: string
}

const syncInProgressErrorCode = "sync_in_progress"
const syncGenericErrorMessage = "Não foi possível sincronizar as unidades."

let activeUnitSyncPromise: Promise<TriggerUnitsSyncResult> | null = null

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null
  }

  return value as Record<string, unknown>
}

function readMessageFromUnknownError(error: unknown) {
  const record = asRecord(error)

  if (!record) {
    return null
  }

  return typeof record.message === "string" ? record.message : null
}

async function readMessageFromInvokeError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "Não foi possível conectar ao serviço de sincronização. Verifique sua conexão e tente novamente."
    }

    const normalizedMessage = error.message.trim()

    if (normalizedMessage.length > 0) {
      return normalizedMessage
    }
  }

  const record = asRecord(error)

  if (!record) {
    return null
  }

  const context = record.context

  if (context instanceof Response) {
    try {
      const payload = (await context.clone().json()) as { message?: unknown }

      if (typeof payload.message === "string" && payload.message.trim().length > 0) {
        return payload.message
      }
    } catch {
      // No-op: quando o corpo não for JSON, usamos fallback seguro.
    }
  }

  return readMessageFromUnknownError(error)
}

export function isUnitSyncInProgressError(error: unknown) {
  return error instanceof Error && error.message === syncInProgressErrorCode
}

export async function triggerUnitsSync(
  mode: UnitSyncMode = "incremental"
): Promise<TriggerUnitsSyncResult> {
  if (activeUnitSyncPromise) {
    throw new Error(syncInProgressErrorCode)
  }

  const runPromise = executeUnitSync(mode)
  activeUnitSyncPromise = runPromise

  try {
    return await runPromise
  } finally {
    activeUnitSyncPromise = null
  }
}

async function executeUnitSync(
  mode: UnitSyncMode = "incremental"
): Promise<TriggerUnitsSyncResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(syncGenericErrorMessage)
  }

  const rawResponse: unknown = await supabase.functions.invoke("units-sync", {
    body: {
      mode,
      trigger: "manual",
    },
  })

  const response = asRecord(rawResponse)

  if (!response) {
    throw new Error(syncGenericErrorMessage)
  }

  const error = response.error

  if (error) {
    const message = (await readMessageFromInvokeError(error)) ?? syncGenericErrorMessage

    throw new Error(message)
  }

  const payload = (response.data ?? {}) as {
    runId?: unknown
    status?: unknown
    message?: unknown
  }

  const status =
    payload.status === "success" || payload.status === "warning" || payload.status === "failed"
      ? payload.status
      : "failed"

  const message =
    typeof payload.message === "string" && payload.message.trim().length > 0
      ? payload.message
      : "Sincronização concluída."

  return {
    runId: typeof payload.runId === "string" ? payload.runId : null,
    status,
    message,
  }
}
