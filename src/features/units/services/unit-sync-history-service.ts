import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
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
    message: row.message,
    counters: {
      received: row.counters_received,
      created: row.counters_created,
      updated: row.counters_updated,
      unchanged: row.counters_unchanged,
      failed: row.counters_failed,
    },
    consecutiveFailures: row.consecutive_failures,
  }
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
    ].join(","))
    .order("started_at", { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as RawUnitSyncRunRow[]).map(mapUnitSyncHistory)
}
