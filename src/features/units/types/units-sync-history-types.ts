import {
  type SyncCounters,
  type SyncHistoryEntry,
  type SyncRunMode,
  type SyncRunStatus,
  type SyncRunTrigger,
} from "@/features/sync"

export type UnitSyncRunMode = SyncRunMode
export type UnitSyncTrigger = SyncRunTrigger
export type UnitSyncRunStatus = SyncRunStatus

export interface UnitSyncCounters {
  received: number
  created: number
  updated: number
  unchanged: number
  failed: number
}

export interface UnitSyncHistoryEntry extends Omit<SyncHistoryEntry, "counters"> {
  counters: SyncCounters & UnitSyncCounters
}
