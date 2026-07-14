import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import {
  normalizeSyncErrorDetails,
  normalizeSyncHistoryMessage,
} from "@/features/sync/utils/sync-history-errors"
import { type ClientSyncHistoryEntry } from "../types/clients-sync-history-types"

const SYNC_HISTORY_LIMIT = 50

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
  error_details: unknown
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
    message: normalizeSyncHistoryMessage(row.message, row.status),
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
    errorDetails: normalizeSyncErrorDetails(row.error_details),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isSyncMode(value: unknown): value is RawClientSyncRunRow["mode"] {
  return value === "full" || value === "incremental"
}

function isSyncTrigger(value: unknown): value is RawClientSyncRunRow["trigger"] {
  return value === "automatic" || value === "manual"
}

function isSyncStatus(value: unknown): value is RawClientSyncRunRow["status"] {
  return value === "success" || value === "warning" || value === "failed"
}

function isRawClientSyncRunRow(value: unknown): value is RawClientSyncRunRow {
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
    typeof value.counters_clients_received === "number" &&
    typeof value.counters_clients_created === "number" &&
    typeof value.counters_clients_updated === "number" &&
    typeof value.counters_clients_unchanged === "number" &&
    typeof value.counters_clients_failed === "number" &&
    typeof value.counters_vehicles_received === "number" &&
    typeof value.counters_vehicles_created === "number" &&
    typeof value.counters_vehicles_updated === "number" &&
    typeof value.counters_vehicles_unchanged === "number" &&
    typeof value.counters_vehicles_failed === "number" &&
    typeof value.consecutive_failures === "number" &&
    "error_details" in value
  )
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
      "error_details",
    ].join(","))
    .order("started_at", { ascending: false })
    .limit(SYNC_HISTORY_LIMIT)

  if (error) {
    throw new Error(error.message)
  }

  const rows: unknown = data

  return (Array.isArray(rows) ? rows : [])
    .filter(isRawClientSyncRunRow)
    .map(mapClientSyncHistory)
}
