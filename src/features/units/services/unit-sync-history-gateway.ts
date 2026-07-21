import { isErpCatalogMockEnabled } from "@/features/erp-mock"

import { createMockUnitSyncHistoryGateway } from "./unit-sync-history-mock-gateway"
import { createSupabaseUnitSyncHistoryGateway } from "./unit-sync-history-supabase-gateway"
import { type UnitSyncHistoryGateway } from "./unit-sync-history-types"

const mockUnitSyncHistoryGateway = createMockUnitSyncHistoryGateway()
const supabaseUnitSyncHistoryGateway = createSupabaseUnitSyncHistoryGateway()

function createDefaultUnitSyncHistoryGateway(): UnitSyncHistoryGateway {
  return {
    listHistory() {
      return isErpCatalogMockEnabled()
        ? mockUnitSyncHistoryGateway.listHistory()
        : supabaseUnitSyncHistoryGateway.listHistory()
    },
    recordMockRun(input) {
      return mockUnitSyncHistoryGateway.recordMockRun?.(input) ?? Promise.resolve(null)
    },
  }
}

let unitSyncHistoryGateway: UnitSyncHistoryGateway = createDefaultUnitSyncHistoryGateway()

export function getUnitSyncHistoryGateway() {
  return unitSyncHistoryGateway
}

export function configureUnitSyncHistoryGateway(gateway: UnitSyncHistoryGateway) {
  unitSyncHistoryGateway = gateway
}

export function resetUnitSyncHistoryGateway() {
  unitSyncHistoryGateway = createDefaultUnitSyncHistoryGateway()
}

export type {
  RecordMockUnitSyncHistoryRunInput,
  UnitSyncHistoryGateway,
} from "./unit-sync-history-types"
