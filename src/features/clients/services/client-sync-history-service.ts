import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { type ClientSyncHistoryEntry } from "../types/clients-sync-history-types"

type RawClientSyncRunRow = {
  id: string
  mode: "full" | "incremental"
  trigger: "automatic" | "manual"
  status: "success" | "warning" | "failed"
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  message: string
  counters_clients_received: number
  counters_clients_created: number
  counters_clients_updated: number
  counters_clients_unchanged: number
  counters_clients_failed: number
  counters_vehicles_received: number
  counters_vehicles_created: number
  counters_vehicles_updated: number
  counters_vehicles_unchanged: number
  counters_vehicles_failed: number
  consecutive_failures: number
}

function mapClientSyncHistory(row: RawClientSyncRunRow): ClientSyncHistoryEntry {
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
      clientsReceived: row.counters_clients_received,
      clientsCreated: row.counters_clients_created,
      clientsUpdated: row.counters_clients_updated,
      clientsUnchanged: row.counters_clients_unchanged,
      clientsFailed: row.counters_clients_failed,
      vehiclesReceived: row.counters_vehicles_received,
      vehiclesCreated: row.counters_vehicles_created,
      vehiclesUpdated: row.counters_vehicles_updated,
      vehiclesUnchanged: row.counters_vehicles_unchanged,
      vehiclesFailed: row.counters_vehicles_failed,
    },
    consecutiveFailures: row.consecutive_failures,
  }
}

export async function listClientSyncHistory(): Promise<ClientSyncHistoryEntry[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("client_sync_runs")
    .select([
      "id",
      "mode",
      "trigger",
      "status",
      "started_at",
      "finished_at",
      "duration_seconds",
      "message",
      "counters_clients_received",
      "counters_clients_created",
      "counters_clients_updated",
      "counters_clients_unchanged",
      "counters_clients_failed",
      "counters_vehicles_received",
      "counters_vehicles_created",
      "counters_vehicles_updated",
      "counters_vehicles_unchanged",
      "counters_vehicles_failed",
      "consecutive_failures",
    ].join(","))
    .order("started_at", { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as RawClientSyncRunRow[]).map(mapClientSyncHistory)
}
