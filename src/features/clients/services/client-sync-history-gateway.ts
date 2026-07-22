import { createSupabaseClientSyncHistoryGateway } from "./client-sync-history-supabase-gateway"
import { type ClientSyncHistoryGateway } from "./client-sync-history-types"

let clientSyncHistoryGateway: ClientSyncHistoryGateway = createSupabaseClientSyncHistoryGateway()

export function getClientSyncHistoryGateway() {
  return clientSyncHistoryGateway
}

export function configureClientSyncHistoryGateway(gateway: ClientSyncHistoryGateway) {
  clientSyncHistoryGateway = gateway
}

export function resetClientSyncHistoryGateway() {
  clientSyncHistoryGateway = createSupabaseClientSyncHistoryGateway()
}

export type { ClientSyncHistoryGateway } from "./client-sync-history-types"
