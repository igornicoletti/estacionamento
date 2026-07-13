import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export type ClientSyncMode = "full" | "incremental"

interface TriggerClientsSyncResult {
  runId: string | null
  status: "success" | "warning" | "failed"
  message: string
}

const syncInProgressErrorCode = "sync_in_progress"
const syncGenericErrorMessage = "Não foi possível sincronizar os clientes."
let activeClientSyncPromise: Promise<TriggerClientsSyncResult> | null = null

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  const record = asRecord(error)
  const message = record?.message
  return typeof message === "string" && message.trim() ? message : null
}

async function readInvokeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Não foi possível conectar ao serviço de sincronização. Verifique sua conexão e tente novamente."
  }

  const record = asRecord(error)
  const context = record?.context

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { message?: unknown }
      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message
      }
    } catch {
      return readErrorMessage(error)
    }
  }

  return readErrorMessage(error)
}

function parseSyncResponse(
  value: unknown,
  fallbackMessage: string
): TriggerClientsSyncResult {
  const response = asRecord(value)

  if (!response) {
    throw new Error(fallbackMessage)
  }

  const payload = asRecord(response.data) ?? {}
  const status =
    payload.status === "success" || payload.status === "warning" || payload.status === "failed"
      ? payload.status
      : "failed"

  return {
    runId: typeof payload.runId === "string" ? payload.runId : null,
    status,
    message: typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : fallbackMessage,
  }
}


export function isClientSyncInProgressError(error: unknown) {
  return error instanceof Error && error.message === syncInProgressErrorCode
}

export async function triggerClientsSync(mode: ClientSyncMode = "incremental"): Promise<TriggerClientsSyncResult> {
  if (activeClientSyncPromise) {
    throw new Error(syncInProgressErrorCode)
  }

  const promise = executeClientSync(mode)
  activeClientSyncPromise = promise

  try {
    return await promise
  } finally {
    activeClientSyncPromise = null
  }
}

async function executeClientSync(mode: ClientSyncMode): Promise<TriggerClientsSyncResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(syncGenericErrorMessage)
  }

  const response = await supabase.functions.invoke("clients-sync", {
    body: { mode, trigger: "manual" },
  }) as { data: unknown; error: unknown }

  if (response.error) {
    throw new Error((await readInvokeErrorMessage(response.error)) ?? syncGenericErrorMessage)
  }

  return parseSyncResponse({ data: response.data }, "Sincronização concluída.")
}
