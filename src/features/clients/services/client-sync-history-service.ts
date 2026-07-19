import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { CLIENTS_SYNC_HISTORY_LIMIT, clientsCopy } from "../constants"
import { parseClientSyncHistory, type ClientSyncHistoryEntry } from "../model"

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(clientsCopy.sync.historyLoadError)
  }

  return supabase
}

export async function listClientSyncHistory(): Promise<ClientSyncHistoryEntry[]> {
  const supabase = getSupabaseOrThrow()
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
    .limit(CLIENTS_SYNC_HISTORY_LIMIT)

  if (error) {
    throw new Error(clientsCopy.sync.historyLoadError, { cause: error })
  }

  return parseClientSyncHistory(data ?? [])
}
