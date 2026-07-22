import { getClientSyncHistoryGateway } from "./client-sync-history-gateway"

export {
  configureClientSyncHistoryGateway,
  getClientSyncHistoryGateway,
  resetClientSyncHistoryGateway,
  type ClientSyncHistoryGateway,
} from "./client-sync-history-gateway"

export async function listClientSyncHistory() {
  const entries = await getClientSyncHistoryGateway().listHistory()

  return [...entries]
}
