import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  clientSyncRunRowsSchema,
  syncPhaseResultSchema,
  syncStateWireSchema,
  unitSyncRunRowsSchema,
} from "../schemas/sync-gateway-schemas"
import { type SyncGateway } from "./sync-gateway-contracts"

const invokeResponseSchema = z
  .object({ data: z.unknown(), error: z.unknown().nullable() })
  .strict()

const historyLimit = 30

export class SyncGatewayError extends Error {
  constructor(message = "Não foi possível acessar a sincronização.", cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = "SyncGatewayError"
  }
}

export function createSupabaseSyncGateway(): SyncGateway {
  return {
    async listHistory(resource) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) throw new SyncGatewayError()

      const runsQuery = resource === "units"
        ? supabase
          .from("unit_sync_runs")
          .select("id, mode, trigger, status, started_at, finished_at, duration_seconds, message, counters_received, counters_created, counters_updated, counters_unchanged, counters_failed")
          .order("started_at", { ascending: false })
          .limit(historyLimit)
        : supabase
          .from("client_sync_runs")
          .select("id, mode, trigger, status, started_at, finished_at, duration_seconds, message, counters_clients_received, counters_clients_created, counters_clients_updated, counters_clients_unchanged, counters_clients_failed, counters_clients_rejected, counters_vehicles_received, counters_vehicles_created, counters_vehicles_updated, counters_vehicles_unchanged, counters_vehicles_failed, counters_vehicles_rejected, metadata")
          .order("started_at", { ascending: false })
          .limit(historyLimit)
      const stateTable = resource === "units" ? "unit_sync_state" : "client_sync_state"
      const [runsResponse, stateResponse] = await Promise.all([
        runsQuery,
        supabase
          .from(stateTable)
          .select("last_cursor")
          .eq("singleton_key", true)
          .maybeSingle(),
      ])

      if (runsResponse.error || stateResponse.error) {
        throw new SyncGatewayError(
          "Não foi possível carregar o histórico de sincronização.",
          runsResponse.error ?? stateResponse.error
        )
      }

      const state = syncStateWireSchema.safeParse(
        stateResponse.data ?? { last_cursor: null }
      )

      if (!state.success) {
        throw new SyncGatewayError(
          "O histórico de sincronização retornou dados inválidos.",
          state.error
        )
      }

      if (resource === "units") {
        const runs = unitSyncRunRowsSchema.safeParse(runsResponse.data ?? [])

        if (!runs.success) {
          throw new SyncGatewayError(
            "O histórico de sincronização retornou dados inválidos.",
            runs.error
          )
        }

        return { state: state.data, unitRuns: runs.data }
      }

      const runs = clientSyncRunRowsSchema.safeParse(runsResponse.data ?? [])

      if (!runs.success) {
        throw new SyncGatewayError(
          "O histórico de sincronização retornou dados inválidos.",
          runs.error
        )
      }

      return { state: state.data, clientRuns: runs.data }
    },

    async runPhase(command) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) throw new SyncGatewayError()

      const body = command.resource === "units"
        ? { mode: command.mode }
        : {
          mode: command.mode,
          scope: command.scope ?? "clients",
          ...(command.partitionIndex === undefined
            ? {}
            : { partitionIndex: command.partitionIndex }),
        }
      const response: unknown = await supabase.functions.invoke(
        command.resource === "units" ? "units-sync" : "clients-sync",
        { body }
      )
      const invokeResult = invokeResponseSchema.safeParse(response)

      if (!invokeResult.success || invokeResult.data.error) {
        throw new SyncGatewayError(
          "Não foi possível executar a sincronização.",
          invokeResult.success ? invokeResult.data.error : invokeResult.error
        )
      }

      const payload = syncPhaseResultSchema.safeParse(invokeResult.data.data)

      if (!payload.success) {
        throw new SyncGatewayError(
          "A sincronização retornou uma resposta inválida.",
          payload.error
        )
      }

      return payload.data
    },
  }
}
