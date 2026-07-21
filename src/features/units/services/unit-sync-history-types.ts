import {
  type TriggerUnitsSyncResult,
  type UnitSyncHistoryEntry,
  type UnitSyncRunMode,
  type UnitSyncTrigger,
} from "../model"

export interface RecordMockUnitSyncHistoryRunInput {
  mode: UnitSyncRunMode
  trigger: UnitSyncTrigger
  result: TriggerUnitsSyncResult
}

export interface UnitSyncHistoryGateway {
  listHistory: () => Promise<readonly UnitSyncHistoryEntry[]>
  recordMockRun?: (input: RecordMockUnitSyncHistoryRunInput) => Promise<UnitSyncHistoryEntry | null>
}
