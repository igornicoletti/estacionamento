import { createSupabaseSyncGateway } from "./supabase-sync-gateway"
import { type SyncGateway } from "./sync-gateway-contracts"

let activeSyncGateway: SyncGateway = createSupabaseSyncGateway()

export function getSyncGateway() {
  return activeSyncGateway
}

export function setSyncGateway(gateway: SyncGateway) {
  activeSyncGateway = gateway
}

export function resetSyncGateway() {
  activeSyncGateway = createSupabaseSyncGateway()
}
