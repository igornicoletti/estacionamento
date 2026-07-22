import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENT_SYNC_DEFAULT_MODE,
  CLIENT_SYNC_FETCH_ERROR_MESSAGE,
  CLIENT_SYNC_FUNCTION_NAME,
  CLIENT_SYNC_IN_PROGRESS_ERROR_CODE,
  CLIENT_SYNC_MANUAL_TRIGGER,
} from "../constants/clients-sync"
import {
  isRecord,
  parseTriggerClientsSyncResult,
  readNullableString,
  type ClientSyncMode,
  type TriggerClientsSyncResult,
} from "../model"

interface FunctionInvokeResult {
  data: unknown
  error: unknown
}

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
  if (error instanceof Error && error.message === CLIENT_SYNC_FETCH_ERROR_MESSAGE) {
    return clientsCopy.errors.syncUnavailable
  }

  if (isRecord(error) && error.context instanceof Response) {
    try {
      const payload: unknown = await error.context.clone().json()

      if (isRecord(payload)) {
        return readNullableString(payload.message) ?? readErrorMessage(error)
      }
    } catch {
      return readErrorMessage(error)
    }
  }

  return readErrorMessage(error)
}

function parseFunctionInvokeResponse(value: unknown): FunctionInvokeResult {
  const record = isRecord(value) ? value : null

  if (!record) {
    throw new Error(clientsCopy.sync.feedback.error)
  }

  return {
    data: record.data,
    error: record.error ?? null,
  }
}

export function isClientSyncInProgressError(error: unknown) {
  return error instanceof Error && error.message === CLIENT_SYNC_IN_PROGRESS_ERROR_CODE
}

export async function triggerClientsSync(
  mode: ClientSyncMode = CLIENT_SYNC_DEFAULT_MODE
): Promise<TriggerClientsSyncResult> {
  if (activeClientSyncPromise) {
    throw new Error(CLIENT_SYNC_IN_PROGRESS_ERROR_CODE)
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
    throw new Error(clientsCopy.sync.feedback.error)
  }

  const response: unknown = await supabase.functions.invoke(CLIENT_SYNC_FUNCTION_NAME, {
    body: { mode, trigger: CLIENT_SYNC_MANUAL_TRIGGER },
  })
  const invokeResult = parseFunctionInvokeResponse(response)

  if (invokeResult.error) {
    throw new Error(
      (await readInvokeErrorMessage(invokeResult.error)) ?? clientsCopy.sync.feedback.error
    )
  }

  return parseTriggerClientsSyncResult(invokeResult.data)
}
