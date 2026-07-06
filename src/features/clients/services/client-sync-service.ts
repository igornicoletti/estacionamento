import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export type ClientSyncMode = "full" | "incremental"

interface TriggerClientsSyncResult {
  runId: string | null
  status: "success" | "warning" | "failed"
  message: string
}

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

export async function triggerClientsSync(
  mode: ClientSyncMode = "incremental"
): Promise<TriggerClientsSyncResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error("Supabase nao esta configurado para sincronizacao.")
  }

  const rawResponse: unknown = await supabase.functions.invoke("clients-sync", {
    body: {
      mode,
      trigger: "manual",
    },
  })

  const response = asRecord(rawResponse)

  if (!response) {
    throw new Error("Falha ao sincronizar clientes.")
  }

  const error = response.error

  if (error) {
    const message = readMessageFromUnknownError(error) ?? "Falha ao sincronizar clientes."

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
      : "Sincronizacao concluida."

  return {
    runId: typeof payload.runId === "string" ? payload.runId : null,
    status,
    message,
  }
}
