import { createSupabaseUnitSyncHistoryGateway } from "./unit-sync-history-supabase-gateway"
import { type UnitSyncHistoryGateway } from "./unit-sync-history-types"

let unitSyncHistoryGateway: UnitSyncHistoryGateway = createSupabaseUnitSyncHistoryGateway()

export function getUnitSyncHistoryGateway() {
  return unitSyncHistoryGateway
}

export function configureUnitSyncHistoryGateway(gateway: UnitSyncHistoryGateway) {
  unitSyncHistoryGateway = gateway
}

export function resetUnitSyncHistoryGateway() {
  unitSyncHistoryGateway = createSupabaseUnitSyncHistoryGateway()
}

export type { UnitSyncHistoryGateway } from "./unit-sync-history-types"
