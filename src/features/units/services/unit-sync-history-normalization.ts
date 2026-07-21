import { z } from "zod"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_SYNC_HISTORY_LIMIT } from "../constants/units-persistence"
import { UNIT_SYNC_RUN_MODES, UNIT_SYNC_STATUSES, UNIT_SYNC_SUCCESS_STATUS, UNIT_SYNC_TRIGGERS } from "../constants/units-sync"
import { type UnitSyncHistoryEntry, type UnitSyncRunStatus } from "../model"

const syncModeSchema = z.enum(UNIT_SYNC_RUN_MODES)
const syncTriggerSchema = z.enum(UNIT_SYNC_TRIGGERS)
const syncStatusSchema = z.enum(UNIT_SYNC_STATUSES)
const unitSyncCountersSchema = z.object({
  received: z.number(),
  created: z.number(),
  updated: z.number(),
  unchanged: z.number(),
  failed: z.number(),
})
const rawUnitSyncRunRowSchema = z.object({
  id: z.string().trim().min(1),
  mode: syncModeSchema,
  trigger: syncTriggerSchema,
  status: syncStatusSchema,
  started_at: z.string().trim().min(1),
  finished_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  message: z.string(),
  counters_received: z.number(),
  counters_created: z.number(),
  counters_updated: z.number(),
  counters_unchanged: z.number(),
  counters_failed: z.number(),
  consecutive_failures: z.number(),
  error_details: z.unknown(),
})
const unitSyncHistoryEntrySchema = z.object({
  id: z.string().trim().min(1),
  mode: syncModeSchema,
  trigger: syncTriggerSchema,
  status: syncStatusSchema,
  startedAt: z.string().trim().min(1),
  finishedAt: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  message: z.string(),
  counters: unitSyncCountersSchema,
  consecutiveFailures: z.number(),
  errorDetails: z.array(z.string()),
})
const supabaseResponseSchema = z.object({ data: z.unknown().nullable(), error: z.unknown().nullable() }).passthrough()
const rawUnitSyncRunRowsSchema = z.array(rawUnitSyncRunRowSchema)
const unitSyncHistoryEntriesSchema = z.array(unitSyncHistoryEntrySchema)
type RawUnitSyncRunRow = z.infer<typeof rawUnitSyncRunRowSchema>

function normalizeSyncHistoryMessage(message: string, status: UnitSyncRunStatus) {
  const value = message.trim()
  return value || (status === UNIT_SYNC_SUCCESS_STATUS ? unitsCopy.sync.feedback.success : unitsCopy.sync.feedback.error)
}

function normalizeSyncErrorDetails(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
}

function mapUnitSyncHistory(row: RawUnitSyncRunRow): UnitSyncHistoryEntry {
  return {
    id: row.id,
    mode: row.mode,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationSeconds: row.duration_seconds,
    message: normalizeSyncHistoryMessage(row.message, row.status),
    counters: {
      received: row.counters_received,
      created: row.counters_created,
      updated: row.counters_updated,
      unchanged: row.counters_unchanged,
      failed: row.counters_failed,
    },
    consecutiveFailures: row.consecutive_failures,
    errorDetails: normalizeSyncErrorDetails(row.error_details),
  }
}

export function sortUnitSyncHistoryEntries(entries: readonly UnitSyncHistoryEntry[]) {
  return [...entries].sort((left, right) => right.startedAt.localeCompare(left.startedAt))
}

export function limitUnitSyncHistoryEntries(entries: readonly UnitSyncHistoryEntry[]) {
  return sortUnitSyncHistoryEntries(entries).slice(0, UNIT_SYNC_HISTORY_LIMIT)
}

export function parseSupabaseUnitSyncHistoryResponse(value: unknown) {
  const result = supabaseResponseSchema.safeParse(value)
  if (!result.success) {
    throw new Error(unitsCopy.sync.historyLoadError, { cause: result.error })
  }
  if (result.data.error) {
    throw new Error(unitsCopy.sync.historyLoadError, { cause: result.data.error })
  }
  return result.data.data
}

export function parseUnitSyncHistoryRows(value: unknown) {
  const result = rawUnitSyncRunRowsSchema.safeParse(value ?? [])
  if (!result.success) {
    throw new Error(unitsCopy.sync.historyLoadError, { cause: result.error })
  }
  return limitUnitSyncHistoryEntries(result.data.map(mapUnitSyncHistory))
}

export function parseStoredUnitSyncHistory(value: unknown) {
  const result = unitSyncHistoryEntriesSchema.safeParse(value)
  return result.success ? limitUnitSyncHistoryEntries(result.data) : []
}
