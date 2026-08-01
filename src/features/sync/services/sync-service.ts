import { getSyncGateway } from "../gateways/sync-gateway"
import { toSyncHistorySnapshot } from "../model/sync-models"
import {
  type SyncExecutionSummary,
  type SyncMode,
  type SyncProgress,
  type SyncResource,
  type SyncRun,
  type SyncStatus,
} from "../model/sync-types"

export class SyncExecutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SyncExecutionError"
  }
}

export async function listSyncHistory(resource: SyncResource) {
  return toSyncHistorySnapshot(
    resource,
    await getSyncGateway().listHistory(resource)
  )
}

function resolveSummaryStatus(runs: SyncRun[]): SyncStatus {
  if (runs.some((run) => run.status === "failed")) return "failed"
  if (runs.some((run) => run.status === "warning")) return "warning"
  return "success"
}

function createSummary(resource: SyncResource, runs: SyncRun[]): SyncExecutionSummary {
  const sum = (read: (run: SyncRun) => number) =>
    runs.reduce((total, run) => total + read(run), 0)
  const status = resolveSummaryStatus(runs)

  return {
    resource,
    status,
    message:
      status === "success"
        ? "Sincronização concluída com sucesso."
        : status === "warning"
          ? "Sincronização concluída com ressalvas."
          : "A sincronização não foi concluída.",
    received: sum((run) => run.received),
    created: sum((run) => run.created),
    updated: sum((run) => run.updated),
    unchanged: sum((run) => run.unchanged),
    failed: sum((run) => run.failed),
    rejected: sum((run) => run.rejected),
    durationSeconds: sum((run) => run.durationSeconds ?? 0),
  }
}

function assertPhaseStarted(result: { runId: string | null; message: string }) {
  if (!result.runId) throw new SyncExecutionError(result.message)
}

export async function executeManualSync(
  resource: SyncResource,
  mode: SyncMode = "incremental",
  onProgress?: (progress: SyncProgress) => void
) {
  const gateway = getSyncGateway()
  const before = await listSyncHistory(resource)
  const totalSteps = resource === "clients" ? 9 : 1
  const runIds = new Set<string>()

  onProgress?.({
    completedSteps: 0,
    totalSteps,
    estimatedSeconds: before.estimatedSeconds,
  })

  const first = await gateway.runPhase({ resource, mode })
  assertPhaseStarted(first)
  runIds.add(first.runId as string)
  onProgress?.({
    completedSteps: 1,
    totalSteps,
    estimatedSeconds: before.estimatedSeconds,
  })

  if (resource === "clients") {
    let snapshot = await listSyncHistory("clients")
    let processed = 0

    while (snapshot.cursor) {
      if (processed >= 20) {
        throw new SyncExecutionError("O ciclo de veículos excedeu o limite seguro de etapas.")
      }

      const cursor = snapshot.cursor
      const phase = await gateway.runPhase({
        resource: "clients",
        mode: cursor.mode,
        scope: "vehicles",
        partitionIndex: cursor.nextPartition,
      })
      assertPhaseStarted(phase)
      runIds.add(phase.runId as string)
      processed += 1
      onProgress?.({
        completedSteps: Math.min(1 + processed, 1 + cursor.partitionCount),
        totalSteps: 1 + cursor.partitionCount,
        estimatedSeconds: before.estimatedSeconds,
      })
      snapshot = await listSyncHistory("clients")
    }
  }

  const after = await listSyncHistory(resource)
  const completedRuns = after.runs.filter((run) => runIds.has(run.id))

  if (!completedRuns.length) {
    throw new SyncExecutionError("A sincronização terminou sem um histórico verificável.")
  }

  const summary = createSummary(resource, completedRuns)

  if (summary.status === "failed") {
    throw new SyncExecutionError(summary.message)
  }

  return summary
}
