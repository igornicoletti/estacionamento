import { type SyncGateway } from "@/features/sync/gateways/sync-gateway-contracts"
import { type SyncPhaseCommand } from "@/features/sync/model/sync-types"
import {
  type ClientSyncRunWire,
  type UnitSyncRunWire,
} from "@/features/sync/schemas/sync-gateway-schemas"

export function createUnitSyncRun(
  overrides: Partial<UnitSyncRunWire> = {}
): UnitSyncRunWire {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    mode: "incremental",
    trigger: "manual",
    status: "success",
    started_at: "2026-08-01T10:00:00.000Z",
    finished_at: "2026-08-01T10:00:12.000Z",
    duration_seconds: 12,
    message: "Sincronização concluída com sucesso.",
    counters_received: 10,
    counters_created: 2,
    counters_updated: 3,
    counters_unchanged: 5,
    counters_failed: 0,
    ...overrides,
  }
}

export function createClientSyncRun(
  overrides: Partial<ClientSyncRunWire> = {}
): ClientSyncRunWire {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    mode: "incremental",
    trigger: "manual",
    status: "success",
    started_at: "2026-08-01T10:00:00.000Z",
    finished_at: "2026-08-01T10:00:08.000Z",
    duration_seconds: 8,
    message: "Sincronização concluída com sucesso.",
    counters_clients_received: 10,
    counters_clients_created: 2,
    counters_clients_updated: 3,
    counters_clients_unchanged: 5,
    counters_clients_failed: 0,
    counters_clients_rejected: 0,
    counters_vehicles_received: 0,
    counters_vehicles_created: 0,
    counters_vehicles_updated: 0,
    counters_vehicles_unchanged: 0,
    counters_vehicles_failed: 0,
    counters_vehicles_rejected: 0,
    metadata: { scope: "clients" },
    ...overrides,
  }
}

export function createMemorySyncGateway(): SyncGateway {
  return {
    listHistory: () =>
      Promise.resolve({ state: { last_cursor: null }, unitRuns: [] }),
    runPhase: () =>
      Promise.resolve({
        runId: "11111111-1111-4111-8111-111111111111",
        status: "success",
        message: "Sincronização concluída com sucesso.",
      }),
  }
}

export function isVehiclePhase(command: SyncPhaseCommand) {
  return command.resource === "clients" && command.scope === "vehicles"
}
