import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_SYNC_HISTORY_LIMIT } from "../constants/units-persistence"
import { parseSupabaseUnitSyncHistoryResponse, parseUnitSyncHistoryRows } from "./unit-sync-history-normalization"
import { type UnitSyncHistoryGateway } from "./unit-sync-history-types"

export function createSupabaseUnitSyncHistoryGateway(): UnitSyncHistoryGateway {
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
      const data = parseSupabaseUnitSyncHistoryResponse(response)
      return parseUnitSyncHistoryRows(data)
    },
  }
}
