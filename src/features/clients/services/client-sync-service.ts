import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { clientsCopy } from "../constants"
import {
  isRecord,
  parseTriggerClientsSyncResult,
  readNullableString,
  type ClientSyncMode,
  type TriggerClientsSyncResult,
} from "../model"

const syncInProgressErrorCode = "sync_in_progress"
let activeClientSyncPromise: Promise<TriggerClientsSyncResult> | null = null

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (!isRecord(error)) {
    return null
  }

  return readNullableString(error.message)
}

async function readInvokeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return clientsCopy.errors.syncUnavailable
  }

  if (isRecord(error) && error.context instanceof Response) {
    try {
      const payload = await error.context.clone().json() as unknown

      if (isRecord(payload)) {
        return readNullableString(payload.message) ?? readErrorMessage(error)
      }
    } catch {
      return readErrorMessage(error)
    }
  }

  return readErrorMessage(error)
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(clientsCopy.sync.feedback.error)
  }

  return supabase
}

export function isClientSyncInProgressError(error: unknown) {
  return error instanceof Error && error.message === syncInProgressErrorCode
}

export async function triggerClientsSync(
  mode: ClientSyncMode = "incremental"
): Promise<TriggerClientsSyncResult> {
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
  const supabase = getSupabaseOrThrow()
  const response = await supabase.functions.invoke("clients-sync", {
    body: { mode, trigger: "manual" },
  }) as { data: unknown; error: unknown }

  if (response.error) {
    throw new Error(
      (await readInvokeErrorMessage(response.error)) ?? clientsCopy.sync.feedback.error
    )
  }

  return parseTriggerClientsSyncResult(response.data)
}
