import { afterEach, describe, expect, it, vi } from "vitest"

import {
  resetSyncGateway,
  setSyncGateway,
} from "@/features/sync/gateways/sync-gateway"
import {
  executeManualSync,
  listSyncHistory,
} from "@/features/sync/services/sync-service"
import {
  type SyncPhaseCommand,
  type SyncPhaseResult,
} from "@/features/sync/model/sync-types"
import {
  createClientSyncRun,
  createUnitSyncRun,
  isVehiclePhase,
} from "../../helpers/sync-memory-gateway"

afterEach(() => resetSyncGateway())

describe("sync service", () => {
  it("maps history and estimates duration from successful runs", async () => {
    setSyncGateway({
      listHistory: () =>
        Promise.resolve({
          state: { last_cursor: null },
          unitRuns: [
            createUnitSyncRun({ duration_seconds: 10 }),
            createUnitSyncRun({
              id: "33333333-3333-4333-8333-333333333333",
              duration_seconds: 20,
            }),
          ],
        }),
      runPhase: vi.fn(),
    })

    const snapshot = await listSyncHistory("units")

    expect(snapshot.estimatedSeconds).toBe(15)
    expect(snapshot.runs[0]).toMatchObject({ received: 10, created: 2 })
  })

  it("runs client and vehicle phases sequentially before summarizing", async () => {
    let cursor: string | null = null
    const runs = [
      createClientSyncRun({
        id: "66666666-6666-4666-8666-666666666666",
        duration_seconds: 5,
      }),
      createClientSyncRun({
        id: "33333333-3333-4333-8333-333333333333",
        duration_seconds: 4,
        metadata: { scope: "vehicles", partitionCount: 2, partitionIndex: 0 },
      }),
    ]
    const completedRuns = [] as ReturnType<typeof createClientSyncRun>[]
    const runPhase = vi.fn((
      command: SyncPhaseCommand
    ): Promise<SyncPhaseResult> => {
      if (!isVehiclePhase(command)) {
        const run = createClientSyncRun()
        completedRuns.push(run)
        cursor = JSON.stringify({
          version: 1,
          mode: "incremental",
          nextPartition: 0,
          partitionCount: 2,
        })
        return Promise.resolve({
          runId: run.id,
          status: "success",
          message: "Concluída.",
        })
      }

      const partitionIndex = command.partitionIndex ?? 0
      const run = createClientSyncRun({
        id:
          partitionIndex === 0
            ? "44444444-4444-4444-8444-444444444444"
            : "55555555-5555-4555-8555-555555555555",
        counters_clients_received: 0,
        counters_clients_created: 0,
        counters_clients_updated: 0,
        counters_clients_unchanged: 0,
        counters_vehicles_received: 5,
        counters_vehicles_created: 1,
        counters_vehicles_unchanged: 4,
        duration_seconds: 4,
        metadata: { scope: "vehicles", partitionCount: 2, partitionIndex },
      })
      completedRuns.push(run)
      cursor = partitionIndex === 0
        ? JSON.stringify({
          version: 1,
          mode: "incremental",
          nextPartition: 1,
          partitionCount: 2,
        })
        : null
      return Promise.resolve({
        runId: run.id,
        status: "success",
        message: "Concluída.",
      })
    })
    setSyncGateway({
      listHistory: () =>
        Promise.resolve({
          state: { last_cursor: cursor },
          clientRuns: [...completedRuns, ...runs],
        }),
      runPhase,
    })
    const onProgress = vi.fn()

    const summary = await executeManualSync("clients", "incremental", onProgress)

    expect(runPhase).toHaveBeenCalledTimes(3)
    expect(runPhase.mock.calls.map(([command]) => command.scope)).toEqual([
      undefined,
      "vehicles",
      "vehicles",
    ])
    expect(summary).toMatchObject({ received: 20, created: 4, status: "success" })
    expect(onProgress).toHaveBeenLastCalledWith({
      completedSteps: 3,
      totalSteps: 3,
      estimatedSeconds: 13,
    })
  })

  it("rejects an execution whose persisted run failed", async () => {
    const failedRun = createUnitSyncRun({
      status: "failed",
      message: "A integração não respondeu.",
    })

    setSyncGateway({
      listHistory: () =>
        Promise.resolve({
          state: { last_cursor: null },
          unitRuns: [failedRun],
        }),
      runPhase: () =>
        Promise.resolve({
          runId: failedRun.id,
          status: "failed",
          message: failedRun.message,
        }),
    })

    await expect(executeManualSync("units")).rejects.toThrow(
      "A sincronização não foi concluída."
    )
  })
})
