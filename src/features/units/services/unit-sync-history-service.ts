import {
  getUnitSyncHistoryGateway,
  type RecordMockUnitSyncHistoryRunInput,
} from "./unit-sync-history-gateway"

export {
  configureUnitSyncHistoryGateway,
  getUnitSyncHistoryGateway,
  resetUnitSyncHistoryGateway,
  type RecordMockUnitSyncHistoryRunInput,
  type UnitSyncHistoryGateway,
} from "./unit-sync-history-gateway"

export async function recordMockUnitSyncHistoryRun(input: RecordMockUnitSyncHistoryRunInput) {
  const recordMockRun = getUnitSyncHistoryGateway().recordMockRun

  return recordMockRun ? recordMockRun(input) : null
}

export async function listUnitSyncHistory() {
  const entries = await getUnitSyncHistoryGateway().listHistory()

  return [...entries]
}
