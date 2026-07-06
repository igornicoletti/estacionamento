import {
  type SyncCounters,
  type SyncHistoryEntry,
  type SyncRunMode,
  type SyncRunStatus,
  type SyncRunTrigger,
} from "@/components/sync-history/sync-history-types"

export type ClientSyncRunMode = SyncRunMode

export type ClientSyncTrigger = SyncRunTrigger

export type ClientSyncRunStatus = SyncRunStatus

export interface ClientSyncCounters {
  clientsReceived: number
  clientsCreated: number
  clientsUpdated: number
  clientsUnchanged: number
  clientsFailed: number
  vehiclesReceived: number
  vehiclesCreated: number
  vehiclesUpdated: number
  vehiclesUnchanged: number
  vehiclesFailed: number
}

export interface ClientSyncHistoryEntry extends Omit<SyncHistoryEntry, "counters"> {
  counters: SyncCounters & ClientSyncCounters
}
