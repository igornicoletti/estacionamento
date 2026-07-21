import {
  type ClientSyncHistoryEntry,
  type ClientSyncMode,
  type ClientSyncTrigger,
  type TriggerClientsSyncResult,
} from "../model"

export interface RecordMockClientSyncHistoryRunInput {
  mode: ClientSyncMode
  trigger: ClientSyncTrigger
  result: TriggerClientsSyncResult
}

export interface ClientSyncHistoryGateway {
  listHistory: () => Promise<readonly ClientSyncHistoryEntry[]>
  recordMockRun?: (input: RecordMockClientSyncHistoryRunInput) => Promise<ClientSyncHistoryEntry | null>
}
