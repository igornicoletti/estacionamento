import { type ClientSyncHistoryEntry } from "../model"

export interface ClientSyncHistoryGateway {
  listHistory: () => Promise<readonly ClientSyncHistoryEntry[]>
}
