import { z } from "zod"

import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants"
import { type TriggerUnitsSyncResult, type UnitSyncRunMode } from "../model"
import { recordMockUnitSyncHistoryRun } from "./unit-sync-history-service"

const syncInProgressErrorCode = "sync_in_progress"
const unitsSyncFunctionName = "units-sync"
const mockSyncRunIdPrefix = "mock-units-sync"

let activeUnitSyncPromise: Promise<TriggerUnitsSyncResult> | null = null
let mockSyncRunSequence = 0

const triggerUnitsSyncResponseSchema = z.object({
  runId: z.string().nullable().optional(),
  status: z.enum(["success", "warning", "failed"]).optional(),
  message: z.string().trim().optional(),
})

const functionInvokeResponseSchema = z.object({
  data: z.unknown().optional(),
  error: z.unknown().nullable().optional(),
}).passthrough()

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
    return unitsCopy.sync.feedback.connectionError
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
    status: result.data.status ?? "success",
    message: result.data.message?.trim() || unitsCopy.sync.feedback.success,
  }
}

function createMockSyncResult(mode: UnitSyncRunMode): TriggerUnitsSyncResult {
  mockSyncRunSequence += 1

  return {
    runId: `${mockSyncRunIdPrefix}-${mode}-${mockSyncRunSequence}`,
    status: "success",
    message: unitsCopy.sync.feedback.success,
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
  if (isErpCatalogMockEnabled()) {
    await Promise.resolve()

    const result = createMockSyncResult(mode)

    await recordMockUnitSyncHistoryRun({
      mode,
      trigger: "manual",
      result,
    })

    return result
  }

  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(unitsCopy.sync.feedback.error)
  }

  const response: unknown = await supabase.functions.invoke(unitsSyncFunctionName, {
    body: { mode, trigger: "manual" },
  })
  const invokeResult = parseFunctionInvokeResponse(response)

  if (invokeResult.error) {
    throw new Error((await readInvokeErrorMessage(invokeResult.error)) ?? unitsCopy.sync.feedback.error)
  }

  return parseSyncResponse(invokeResult.data)
}
