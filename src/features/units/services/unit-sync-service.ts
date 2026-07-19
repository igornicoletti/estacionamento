import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants"
import { type TriggerUnitsSyncResult, type UnitSyncRunMode } from "../model"

const syncInProgressErrorCode = "sync_in_progress"
let activeUnitSyncPromise: Promise<TriggerUnitsSyncResult> | null = null

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
      const payload: unknown = await context.clone().json()
      const payloadRecord = asRecord(payload)
      const message = payloadRecord?.message

      if (typeof message === "string" && message.trim()) {
        return message
      }
    } catch {
      return readErrorMessage(error)
    }
  }

  return readErrorMessage(error)
}

function parseSyncResponse(value: unknown): TriggerUnitsSyncResult {
  const response = asRecord(value)

  if (!response) {
    throw new Error(unitsCopy.sync.feedback.error)
  }

  const payload = asRecord(response.data) ?? {}
  const status = payload.status === "success" || payload.status === "warning" || payload.status === "failed"
    ? payload.status
    : "failed"

  return {
    runId: typeof payload.runId === "string" ? payload.runId : null,
    status,
    message: typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : unitsCopy.sync.feedback.success,
  }
}

export function isUnitSyncInProgressError(error: unknown) {
  return error instanceof Error && error.message === syncInProgressErrorCode
}

export async function triggerUnitsSync(
  mode: UnitSyncRunMode = "incremental"
): Promise<TriggerUnitsSyncResult> {
  if (activeUnitSyncPromise) {
    throw new Error(syncInProgressErrorCode)
  }

  const promise = executeUnitSync(mode)
  activeUnitSyncPromise = promise

  try {
    return await promise
  } finally {
    activeUnitSyncPromise = null
  }
}

async function executeUnitSync(mode: UnitSyncRunMode): Promise<TriggerUnitsSyncResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(unitsCopy.sync.feedback.error)
  }

  const response = await supabase.functions.invoke("units-sync", {
    body: { mode, trigger: "manual" },
  }) as { data: unknown; error: unknown }

  if (response.error) {
    throw new Error((await readInvokeErrorMessage(response.error)) ?? unitsCopy.sync.feedback.error)
  }

  return parseSyncResponse({ data: response.data })
}
