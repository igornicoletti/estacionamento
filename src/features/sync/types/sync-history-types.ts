export type SyncRunMode = "full" | "incremental"

export type SyncRunTrigger = "automatic" | "manual"

export type SyncRunStatus = "success" | "warning" | "failed"

export interface SyncCounters {
  [key: string]: number
}

export interface SyncHistoryEntry {
  id: string
  mode: SyncRunMode
  trigger: SyncRunTrigger
  status: SyncRunStatus
  startedAt: string
  finishedAt: string | null
  durationSeconds: number | null
  message: string
  counters: SyncCounters
  consecutiveFailures: number
  errorDetails: readonly string[]
}

export interface SyncHistoryCounter {
  label: string
  value: number
}
