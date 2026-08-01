export type SyncResource = "clients" | "units"
export type SyncMode = "full" | "incremental"
export type SyncTrigger = "automatic" | "manual"
export type SyncStatus = "success" | "warning" | "failed"

export interface SyncRun {
  id: string
  resource: SyncResource
  mode: SyncMode
  trigger: SyncTrigger
  status: SyncStatus
  startedAt: string
  finishedAt: string | null
  durationSeconds: number | null
  message: string
  received: number
  created: number
  updated: number
  unchanged: number
  failed: number
  rejected: number
  scope: "clients" | "vehicles" | "units"
  partitionIndex: number | null
  partitionCount: number | null
}

export interface ClientSyncCursor {
  mode: SyncMode
  nextPartition: number
  partitionCount: number
}

export interface SyncHistorySnapshot {
  resource: SyncResource
  runs: SyncRun[]
  cursor: ClientSyncCursor | null
  estimatedSeconds: number | null
}

export interface SyncPhaseCommand {
  mode: SyncMode
  resource: SyncResource
  scope?: "clients" | "vehicles"
  partitionIndex?: number
}

export interface SyncPhaseResult {
  runId: string | null
  status: SyncStatus
  message: string
}

export interface SyncProgress {
  completedSteps: number
  totalSteps: number
  estimatedSeconds: number | null
}

export interface SyncExecutionSummary {
  resource: SyncResource
  status: SyncStatus
  message: string
  received: number
  created: number
  updated: number
  unchanged: number
  failed: number
  rejected: number
  durationSeconds: number
}
