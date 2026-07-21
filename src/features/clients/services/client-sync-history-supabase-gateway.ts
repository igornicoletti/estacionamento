import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENTS_SYNC_HISTORY_LIMIT } from "../constants/clients-persistence"
import {
  parseClientSyncHistoryRows,
  parseSupabaseClientSyncHistoryResponse,
} from "./client-sync-history-normalization"
import { type ClientSyncHistoryGateway } from "./client-sync-history-types"

export function createSupabaseClientSyncHistoryGateway(): ClientSyncHistoryGateway {
  return {
    async listHistory() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(clientsCopy.sync.historyLoadError)
      }

      const response: unknown = await supabase
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
          "counters_clients_rejected",
          "counters_vehicles_received",
          "counters_vehicles_created",
          "counters_vehicles_updated",
          "counters_vehicles_unchanged",
          "counters_vehicles_failed",
          "counters_vehicles_rejected",
          "consecutive_failures",
          "error_details",
        ].join(","))
        .order("started_at", { ascending: false })
        .limit(CLIENTS_SYNC_HISTORY_LIMIT)
      const data = parseSupabaseClientSyncHistoryResponse(response)

      return parseClientSyncHistoryRows(data)
    },
  }
}
