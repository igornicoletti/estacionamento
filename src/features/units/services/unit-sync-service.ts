import { z } from "zod"

import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  UNIT_SYNC_DEFAULT_MODE,
  UNIT_SYNC_FETCH_ERROR_MESSAGE,
  UNIT_SYNC_FUNCTION_NAME,
  UNIT_SYNC_IN_PROGRESS_ERROR_CODE,
  UNIT_SYNC_MANUAL_TRIGGER,
  UNIT_SYNC_MOCK_RUN_ID_PREFIX,
  UNIT_SYNC_STATUSES,
  UNIT_SYNC_SUCCESS_STATUS,
  unitsCopy,
} from "../constants"
import { type TriggerUnitsSyncResult, type UnitSyncRunMode } from "../model"
import { recordMockUnitSyncHistoryRun } from "./unit-sync-history-service"

let activeUnitSyncPromise: Promise<TriggerUnitsSyncResult> | null = null
let mockSyncRunSequence = 0

const triggerUnitsSyncResponseSchema = z.object({
  runId: z.string().nullable().optional(),
  status: z.enum(UNIT_SYNC_STATUSES).optional(),
  message: z.string().trim().optional(),
})

const functionInvokeResponseSchema = z.object({
  data: z.unknown().optional(),
  error: z.unknown().nullable().optional(),
}).passthrough()

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
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

function parseFunctionInvokeResponse(value: unknown) {
  const result = functionInvokeResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(unitsCopy.sync.feedback.error, { cause: result.error })
  }

  return {
    data: result.data.data,
    error: result.data.error ?? null,
  }
}

function parseSyncResponse(value: unknown): TriggerUnitsSyncResult {
  const result = triggerUnitsSyncResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(unitsCopy.sync.feedback.error, { cause: result.error })
  }

  return {
    runId: result.data.runId ?? null,
    status: result.data.status ?? UNIT_SYNC_SUCCESS_STATUS,
    message: result.data.message?.trim() || unitsCopy.sync.feedback.success,
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
    throw new Error((await readInvokeErrorMessage(invokeResult.error)) ?? unitsCopy.sync.feedback.error)
  }

  return parseSyncResponse(invokeResult.data)
}
