import { getUnitSyncHistoryGateway } from "./unit-sync-history-gateway"

export {
  configureUnitSyncHistoryGateway,
  getUnitSyncHistoryGateway,
  resetUnitSyncHistoryGateway,
  type UnitSyncHistoryGateway,
} from "./unit-sync-history-gateway"

export async function listUnitSyncHistory() {
  const entries = await getUnitSyncHistoryGateway().listHistory()
  return [...entries]
}
