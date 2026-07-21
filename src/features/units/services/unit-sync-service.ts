import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import {
  UNIT_SYNC_DEFAULT_MODE,
  UNIT_SYNC_FETCH_ERROR_MESSAGE,
  UNIT_SYNC_FUNCTION_NAME,
  UNIT_SYNC_IN_PROGRESS_ERROR_CODE,
  UNIT_SYNC_MANUAL_TRIGGER,
  UNIT_SYNC_MOCK_RUN_ID_PREFIX,
  UNIT_SYNC_SUCCESS_STATUS,
} from "../constants/units-sync"
import {
  type TriggerUnitsSyncResult,
  type UnitSyncRunMode,
  type UnitSyncRunStatus,
} from "../model"
import { recordMockUnitSyncHistoryRun } from "./unit-sync-history-service"

interface FunctionInvokeResult {
  data: unknown
  error: unknown
}

let activeUnitSyncPromise: Promise<TriggerUnitsSyncResult> | null = null
let mockSyncRunSequence = 0

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function isUnitSyncRunStatus(value: unknown): value is UnitSyncRunStatus {
  return value === "success" || value === "warning" || value === "failed"
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
  if (error instanceof Error && error.message === UNIT_SYNC_FETCH_ERROR_MESSAGE) {
    return unitsCopy.sync.feedback.connectionError
  }

  const record = asRecord(error)
  const context = record?.context

  if (typeof Response !== "undefined" && context instanceof Response) {
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

function parseFunctionInvokeResponse(value: unknown): FunctionInvokeResult {
  const record = asRecord(value)

  if (!record) {
    throw new Error(unitsCopy.sync.feedback.error)
  }

  return {
    data: record.data,
    error: record.error ?? null,
  }
}

function parseSyncResponse(value: unknown): TriggerUnitsSyncResult {
  const record = asRecord(value)

  if (!record) {
    throw new Error(unitsCopy.sync.feedback.error)
  }

  const rawRunId = record.runId
  const rawMessage = record.message
  const message = typeof rawMessage === "string" && rawMessage.trim()
    ? rawMessage.trim()
    : unitsCopy.sync.feedback.success

  return {
    runId: typeof rawRunId === "string" && rawRunId.trim() ? rawRunId : null,
    status: isUnitSyncRunStatus(record.status) ? record.status : UNIT_SYNC_SUCCESS_STATUS,
    message,
  }
}

function createMockSyncResult(mode: UnitSyncRunMode): TriggerUnitsSyncResult {
  mockSyncRunSequence += 1

  return {
    runId: `${UNIT_SYNC_MOCK_RUN_ID_PREFIX}-${mode}-${mockSyncRunSequence}`,
    status: UNIT_SYNC_SUCCESS_STATUS,
    message: unitsCopy.sync.feedback.success,
  }
}

export function isUnitSyncInProgressError(error: unknown) {
  return error instanceof Error && error.message === UNIT_SYNC_IN_PROGRESS_ERROR_CODE
}

export async function triggerUnitsSync(
  mode: UnitSyncRunMode = UNIT_SYNC_DEFAULT_MODE
): Promise<TriggerUnitsSyncResult> {
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
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()

    const result = createMockSyncResult(mode)

    await recordMockUnitSyncHistoryRun({
      mode,
      trigger: UNIT_SYNC_MANUAL_TRIGGER,
      result,
    })

    return result
  }

  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(unitsCopy.sync.feedback.error)
  }

  const response: unknown = await supabase.functions.invoke(UNIT_SYNC_FUNCTION_NAME, {
    body: { mode, trigger: UNIT_SYNC_MANUAL_TRIGGER },
  })
  const invokeResult = parseFunctionInvokeResponse(response)

  if (invokeResult.error) {
    const message = await readInvokeErrorMessage(invokeResult.error)

    throw new Error(message ?? unitsCopy.sync.feedback.error)
  }

  return parseSyncResponse(invokeResult.data)
}
