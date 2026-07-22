import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import {
  UNIT_SYNC_DEFAULT_MODE,
  UNIT_SYNC_FETCH_ERROR_MESSAGE,
  UNIT_SYNC_FUNCTION_NAME,
  UNIT_SYNC_IN_PROGRESS_ERROR_CODE,
  UNIT_SYNC_MANUAL_TRIGGER,
  UNIT_SYNC_SUCCESS_STATUS,
} from "../constants/units-sync"
import { type TriggerUnitsSyncResult, type UnitSyncRunMode, type UnitSyncRunStatus } from "../model"

interface FunctionInvokeResult {
  data: unknown
  error: unknown
}

let activeUnitSyncPromise: Promise<TriggerUnitsSyncResult> | null = null

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function isUnitSyncRunStatus(value: unknown): value is UnitSyncRunStatus {
  return value === "success" || value === "warning" || value === "failed"
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  const message = asRecord(error)?.message
  return typeof message === "string" && message.trim() ? message : null
}

async function readInvokeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === UNIT_SYNC_FETCH_ERROR_MESSAGE) {
    return unitsCopy.sync.feedback.connectionError
  }
  const context = asRecord(error)?.context
  if (typeof Response !== "undefined" && context instanceof Response) {
    try {
      const payload: unknown = await context.clone().json()
      const message = asRecord(payload)?.message
      if (typeof message === "string" && message.trim()) {
        return message
      }
    } catch {
      return readErrorMessage(error)
    }
  }
  return readErrorMessage(error)
}

function parseFunctionInvokeResponse(value: unknown): FunctionInvokeResult {
  const record = asRecord(value)
  if (!record) {
    throw new Error(unitsCopy.sync.feedback.error)
  }
  return { data: record.data, error: record.error ?? null }
}

function parseSyncResponse(value: unknown): TriggerUnitsSyncResult {
  const record = asRecord(value)
  if (!record) {
    throw new Error(unitsCopy.sync.feedback.error)
  }
  const runId = typeof record.runId === "string" && record.runId.trim() ? record.runId : null
  const message = typeof record.message === "string" && record.message.trim() ? record.message.trim() : unitsCopy.sync.feedback.success
  return { runId, status: isUnitSyncRunStatus(record.status) ? record.status : UNIT_SYNC_SUCCESS_STATUS, message }
}

export function isUnitSyncInProgressError(error: unknown) {
  return error instanceof Error && error.message === UNIT_SYNC_IN_PROGRESS_ERROR_CODE
}

export async function triggerUnitsSync(mode: UnitSyncRunMode = UNIT_SYNC_DEFAULT_MODE): Promise<TriggerUnitsSyncResult> {
  if (activeUnitSyncPromise) {
    throw new Error(UNIT_SYNC_IN_PROGRESS_ERROR_CODE)
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
  const response: unknown = await supabase.functions.invoke(UNIT_SYNC_FUNCTION_NAME, { body: { mode, trigger: UNIT_SYNC_MANUAL_TRIGGER } })
  const invokeResult = parseFunctionInvokeResponse(response)
  if (invokeResult.error) {
    throw new Error((await readInvokeErrorMessage(invokeResult.error)) ?? unitsCopy.sync.feedback.error)
  }
  return parseSyncResponse(invokeResult.data)
}
