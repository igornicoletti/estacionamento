import { z } from "zod"

import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { UNIT_SYNC_HISTORY_CACHE_KEY, UNIT_SYNC_HISTORY_LIMIT, unitsCopy } from "../constants"
import {
  type TriggerUnitsSyncResult,
  type UnitSyncHistoryEntry,
  type UnitSyncRunMode,
  type UnitSyncRunStatus,
  type UnitSyncTrigger,
} from "../model"

interface UnitSyncHistoryGateway {
  listHistory: () => Promise<readonly UnitSyncHistoryEntry[]>
  recordMockRun?: (input: RecordMockUnitSyncHistoryRunInput) => Promise<UnitSyncHistoryEntry>
}

interface RecordMockUnitSyncHistoryRunInput {
  mode: UnitSyncRunMode
  trigger: UnitSyncTrigger
  result: TriggerUnitsSyncResult
}

const unitSyncHistoryMockStorageKey = `${UNIT_SYNC_HISTORY_CACHE_KEY}:mock`

const syncModeSchema = z.enum(["full", "incremental"])
const syncTriggerSchema = z.enum(["automatic", "manual"])
const syncStatusSchema = z.enum(["success", "warning", "failed"])

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
  counters: z.object({
    received: z.number(),
    created: z.number(),
    updated: z.number(),
    unchanged: z.number(),
    failed: z.number(),
  }).catchall(z.number()),
  consecutiveFailures: z.number(),
  errorDetails: z.array(z.string()),
})

const supabaseResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z.unknown().nullable(),
}).passthrough()

const rawUnitSyncRunRowsSchema = z.array(rawUnitSyncRunRowSchema)
const unitSyncHistoryEntriesSchema = z.array(unitSyncHistoryEntrySchema)

type RawUnitSyncRunRow = z.infer<typeof rawUnitSyncRunRowSchema>

function normalizeSyncHistoryMessage(message: string, status: UnitSyncRunStatus) {
  const value = message.trim()

  if (value) {
    return value
  }

  return status === "success" ? unitsCopy.sync.feedback.success : unitsCopy.sync.feedback.error
}

function normalizeSyncErrorDetails(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
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

function sortHistoryEntries(entries: readonly UnitSyncHistoryEntry[]) {
  return [...entries].sort((left, right) => right.startedAt.localeCompare(left.startedAt))
}

function limitHistoryEntries(entries: readonly UnitSyncHistoryEntry[]) {
  return sortHistoryEntries(entries).slice(0, UNIT_SYNC_HISTORY_LIMIT)
}

function parseSupabaseResponse(value: unknown, errorMessage: string) {
  const result = supabaseResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(errorMessage, { cause: result.error })
  }

  if (result.data.error) {
    throw new Error(errorMessage, { cause: result.data.error })
  }

  return result.data.data
}

function parseUnitSyncHistoryRows(value: unknown) {
  const result = rawUnitSyncRunRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(unitsCopy.sync.historyLoadError, { cause: result.error })
  }

  return result.data.map(mapUnitSyncHistory)
}

function parseStoredMockHistory(value: unknown) {
  const result = unitSyncHistoryEntriesSchema.safeParse(value)

  if (!result.success) {
    return []
  }

  return limitHistoryEntries(result.data)
}

function readStoredMockHistory(): UnitSyncHistoryEntry[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(unitSyncHistoryMockStorageKey) ?? "[]")

    return parseStoredMockHistory(parsed)
  } catch {
    return []
  }
}

function writeStoredMockHistory(entries: readonly UnitSyncHistoryEntry[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(
      unitSyncHistoryMockStorageKey,
      JSON.stringify(limitHistoryEntries(entries))
    )
  } catch {
    window.localStorage.removeItem(unitSyncHistoryMockStorageKey)
  }
}

function createMockHistoryEntry(input: RecordMockUnitSyncHistoryRunInput): UnitSyncHistoryEntry {
  const now = new Date().toISOString()

  return {
    id: input.result.runId ?? `mock-units-sync-${Date.now()}`,
    mode: input.mode,
    trigger: input.trigger,
    status: input.result.status,
    startedAt: now,
    finishedAt: now,
    durationSeconds: 0,
    message: input.result.message,
    counters: {
      received: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      failed: input.result.status === "failed" ? 1 : 0,
    },
    consecutiveFailures: input.result.status === "failed" ? 1 : 0,
    errorDetails: [],
  }
}

function createMockUnitSyncHistoryGateway(): UnitSyncHistoryGateway {
  return {
    async listHistory() {
      await Promise.resolve()

      return readStoredMockHistory()
    },
    async recordMockRun(input) {
      await Promise.resolve()

      const entry = createMockHistoryEntry(input)
      const entries = limitHistoryEntries([entry, ...readStoredMockHistory()])

      writeStoredMockHistory(entries)

      return entry
    },
  }
}

function createSupabaseUnitSyncHistoryGateway(): UnitSyncHistoryGateway {
  return {
    async listHistory() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.sync.historyLoadError)
      }

      const response: unknown = await supabase
        .from("unit_sync_runs")
        .select([
          "id",
          "mode",
          "trigger",
          "status",
          "started_at",
          "finished_at",
          "duration_seconds",
          "message",
          "counters_received",
          "counters_created",
          "counters_updated",
          "counters_unchanged",
          "counters_failed",
          "consecutive_failures",
          "error_details",
        ].join(","))
        .order("started_at", { ascending: false })
        .limit(UNIT_SYNC_HISTORY_LIMIT)
      const data = parseSupabaseResponse(response, unitsCopy.sync.historyLoadError)

      return parseUnitSyncHistoryRows(data)
    },
  }
}

const mockUnitSyncHistoryGateway = createMockUnitSyncHistoryGateway()
const supabaseUnitSyncHistoryGateway = createSupabaseUnitSyncHistoryGateway()

function createDefaultUnitSyncHistoryGateway(): UnitSyncHistoryGateway {
  return {
    listHistory() {
      return isErpCatalogMockEnabled()
        ? mockUnitSyncHistoryGateway.listHistory()
        : supabaseUnitSyncHistoryGateway.listHistory()
    },
    recordMockRun(input) {
      return mockUnitSyncHistoryGateway.recordMockRun?.(input) ?? Promise.resolve(createMockHistoryEntry(input))
    },
  }
}

let unitSyncHistoryGateway: UnitSyncHistoryGateway = createDefaultUnitSyncHistoryGateway()

export function getUnitSyncHistoryGateway() {
  return unitSyncHistoryGateway
}

export function configureUnitSyncHistoryGateway(gateway: UnitSyncHistoryGateway) {
  unitSyncHistoryGateway = gateway
}

export function resetUnitSyncHistoryGateway() {
  unitSyncHistoryGateway = createDefaultUnitSyncHistoryGateway()
}

export async function recordMockUnitSyncHistoryRun(input: RecordMockUnitSyncHistoryRunInput) {
  const entry = await unitSyncHistoryGateway.recordMockRun?.(input)

  return entry ?? createMockHistoryEntry(input)
}

export async function listUnitSyncHistory(): Promise<UnitSyncHistoryEntry[]> {
  const entries = await unitSyncHistoryGateway.listHistory()

  return limitHistoryEntries(entries)
}
