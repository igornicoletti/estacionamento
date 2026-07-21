import {
  getClientSyncHistoryGateway,
  type RecordMockClientSyncHistoryRunInput,
} from "./client-sync-history-gateway"

export {
  configureClientSyncHistoryGateway,
  getClientSyncHistoryGateway,
  resetClientSyncHistoryGateway,
  type ClientSyncHistoryGateway,
  type RecordMockClientSyncHistoryRunInput,
} from "./client-sync-history-gateway"

export async function recordMockClientSyncHistoryRun(input: RecordMockClientSyncHistoryRunInput) {
  const recordMockRun = getClientSyncHistoryGateway().recordMockRun

  return recordMockRun ? recordMockRun(input) : null
}

export async function listClientSyncHistory() {
  const entries = await getClientSyncHistoryGateway().listHistory()

  return [...entries]
}
