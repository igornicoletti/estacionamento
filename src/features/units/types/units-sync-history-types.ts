export type UnitSyncRunMode = "full" | "incremental"

export type UnitSyncTrigger = "automatic" | "manual"

export type UnitSyncRunStatus = "success" | "warning" | "failed"

export interface UnitSyncCounters {
  received: number
  created: number
  updated: number
  unchanged: number
  failed: number
}

export interface UnitSyncHistoryEntry {
  id: string
  mode: UnitSyncRunMode
  trigger: UnitSyncTrigger
  status: UnitSyncRunStatus
  startedAt: string
  finishedAt: string | null
  durationSeconds: number | null
  message: string
  counters: UnitSyncCounters
  consecutiveFailures: number
}
