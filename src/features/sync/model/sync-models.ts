import {
  type ClientSyncRunWire,
  type UnitSyncRunWire,
} from "../schemas/sync-gateway-schemas"
import {
  type ClientSyncCursor,
  type SyncHistorySnapshot,
  type SyncResource,
  type SyncRun,
} from "./sync-types"

function parseClientCursor(value: string | null): ClientSyncCursor | null {
  if (!value) return null

  try {
    const cursor = JSON.parse(value) as Record<string, unknown>

    return (
      cursor.version === 1 &&
      (cursor.mode === "full" || cursor.mode === "incremental") &&
      Number.isInteger(cursor.nextPartition) &&
      Number(cursor.nextPartition) >= 0 &&
      Number.isInteger(cursor.partitionCount) &&
      Number(cursor.partitionCount) > Number(cursor.nextPartition)
    )
      ? {
        mode: cursor.mode,
        nextPartition: Number(cursor.nextPartition),
        partitionCount: Number(cursor.partitionCount),
      }
      : null
  } catch {
    return null
  }
}

function toUnitRun(row: UnitSyncRunWire): SyncRun {
  return {
    id: row.id,
    resource: "units",
    mode: row.mode,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationSeconds: row.duration_seconds,
    message: row.message,
    received: row.counters_received,
    created: row.counters_created,
    updated: row.counters_updated,
    unchanged: row.counters_unchanged,
    failed: row.counters_failed,
    rejected: 0,
    scope: "units",
    partitionIndex: null,
    partitionCount: null,
  }
}

function toClientRun(row: ClientSyncRunWire): SyncRun {
  const scope = row.metadata.scope === "vehicles" ? "vehicles" : "clients"

  return {
    id: row.id,
    resource: "clients",
    mode: row.mode,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationSeconds: row.duration_seconds,
    message: row.message,
    received: row.counters_clients_received + row.counters_vehicles_received,
    created: row.counters_clients_created + row.counters_vehicles_created,
    updated: row.counters_clients_updated + row.counters_vehicles_updated,
    unchanged: row.counters_clients_unchanged + row.counters_vehicles_unchanged,
    failed: row.counters_clients_failed + row.counters_vehicles_failed,
    rejected: row.counters_clients_rejected + row.counters_vehicles_rejected,
    scope,
    partitionIndex: row.metadata.partitionIndex ?? null,
    partitionCount: row.metadata.partitionCount ?? null,
  }
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle] ?? null
    : Math.ceil(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
}

function estimateSeconds(resource: SyncResource, runs: SyncRun[]) {
  const usable = runs.filter(
    (run) => run.status !== "failed" && (run.durationSeconds ?? 0) > 0
  )

  if (resource === "units") {
    return median(usable.map((run) => run.durationSeconds ?? 0))
  }

  const clientSeconds = median(
    usable.filter((run) => run.scope === "clients").map((run) => run.durationSeconds ?? 0)
  )
  const vehicleRuns = usable.filter((run) => run.scope === "vehicles")
  const vehicleSeconds = median(vehicleRuns.map((run) => run.durationSeconds ?? 0))
  const partitionCount = vehicleRuns.find((run) => run.partitionCount)?.partitionCount

  return clientSeconds !== null && vehicleSeconds !== null && partitionCount
    ? clientSeconds + vehicleSeconds * partitionCount
    : null
}

export function toSyncHistorySnapshot(
  resource: SyncResource,
  wire: {
    clientRuns?: ClientSyncRunWire[]
    unitRuns?: UnitSyncRunWire[]
    state: { last_cursor: string | null }
  }
): SyncHistorySnapshot {
  const runs = resource === "units"
    ? (wire.unitRuns ?? []).map(toUnitRun)
    : (wire.clientRuns ?? []).map(toClientRun)

  return {
    resource,
    runs,
    cursor: resource === "clients" ? parseClientCursor(wire.state.last_cursor) : null,
    estimatedSeconds: estimateSeconds(resource, runs),
  }
}
