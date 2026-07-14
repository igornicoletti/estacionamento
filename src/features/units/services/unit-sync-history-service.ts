import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import {
  normalizeSyncErrorDetails,
  normalizeSyncHistoryMessage,
} from "@/features/sync/utils/sync-history-errors"
import { type UnitSyncHistoryEntry } from "../types/units-sync-history-types"

type RawUnitSyncRunRow = {
  id: string
  mode: "full" | "incremental"
  trigger: "automatic" | "manual"
  status: "success" | "warning" | "failed"
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  message: string
  counters_received: number
  counters_created: number
  counters_updated: number
  counters_unchanged: number
  counters_failed: number
  consecutive_failures: number
  error_details: unknown
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isSyncMode(value: unknown): value is RawUnitSyncRunRow["mode"] {
  return value === "full" || value === "incremental"
}

function isSyncTrigger(value: unknown): value is RawUnitSyncRunRow["trigger"] {
  return value === "automatic" || value === "manual"
}

function isSyncStatus(value: unknown): value is RawUnitSyncRunRow["status"] {
  return value === "success" || value === "warning" || value === "failed"
}

function isRawUnitSyncRunRow(value: unknown): value is RawUnitSyncRunRow {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isSyncMode(value.mode) &&
    isSyncTrigger(value.trigger) &&
    isSyncStatus(value.status) &&
    typeof value.started_at === "string" &&
    (typeof value.finished_at === "string" || value.finished_at === null) &&
    (typeof value.duration_seconds === "number" || value.duration_seconds === null) &&
    typeof value.message === "string" &&
    typeof value.counters_received === "number" &&
    typeof value.counters_created === "number" &&
    typeof value.counters_updated === "number" &&
    typeof value.counters_unchanged === "number" &&
    typeof value.counters_failed === "number" &&
    typeof value.consecutive_failures === "number" &&
    "error_details" in value
  )
}

export async function listUnitSyncHistory(): Promise<UnitSyncHistoryEntry[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
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
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  const rows: unknown = data

  return (Array.isArray(rows) ? rows : [])
    .filter(isRawUnitSyncRunRow)
    .map(mapUnitSyncHistory)
}
