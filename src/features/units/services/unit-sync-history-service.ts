import { type UnitSyncHistoryEntry } from "../types/units-sync-history-types"

const mockUnitSyncHistory: readonly UnitSyncHistoryEntry[] = [
  {
    id: "units-sync-2026-07-04-0300",
    mode: "full",
    trigger: "automatic",
    status: "success",
    startedAt: "2026-07-04T03:00:00-03:00",
    finishedAt: "2026-07-04T03:04:18-03:00",
    durationSeconds: 258,
    message: "Sincronização completa concluída com sucesso.",
    counters: {
      received: 69,
      created: 0,
      updated: 7,
      unchanged: 62,
      failed: 0,
    },
    consecutiveFailures: 0,
  },
  {
    id: "units-sync-2026-07-04-0900",
    mode: "incremental",
    trigger: "automatic",
    status: "warning",
    startedAt: "2026-07-04T09:00:00-03:00",
    finishedAt: "2026-07-04T09:01:42-03:00",
    durationSeconds: 102,
    message: "Sincronização incremental concluída com alertas.",
    counters: {
      received: 8,
      created: 0,
      updated: 5,
      unchanged: 2,
      failed: 1,
    },
    consecutiveFailures: 0,
  },
  {
    id: "units-sync-2026-07-04-1500",
    mode: "incremental",
    trigger: "automatic",
    status: "failed",
    startedAt: "2026-07-04T15:00:00-03:00",
    finishedAt: "2026-07-04T15:00:57-03:00",
    durationSeconds: 57,
    message: "Sincronização incremental não pôde ser concluída.",
    counters: {
      received: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      failed: 1,
    },
    consecutiveFailures: 1,
  },
  {
    id: "units-sync-2026-07-04-2100",
    mode: "incremental",
    trigger: "automatic",
    status: "failed",
    startedAt: "2026-07-04T21:00:00-03:00",
    finishedAt: "2026-07-04T21:01:16-03:00",
    durationSeconds: 76,
    message: "Sincronização incremental não pôde ser concluída.",
    counters: {
      received: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      failed: 1,
    },
    consecutiveFailures: 2,
  },
]

export async function listUnitSyncHistory(): Promise<UnitSyncHistoryEntry[]> {
  await Promise.resolve()
  return [...mockUnitSyncHistory]
}
