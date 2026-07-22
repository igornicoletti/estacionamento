import { type UnitSyncHistoryEntry } from "../model"

export interface UnitSyncHistoryGateway {
  listHistory: () => Promise<readonly UnitSyncHistoryEntry[]>
}
