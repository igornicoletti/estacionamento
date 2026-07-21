import { isErpCatalogMockEnabled } from "@/features/erp-mock"

import { createMockClientSyncHistoryGateway } from "./client-sync-history-mock-gateway"
import { createSupabaseClientSyncHistoryGateway } from "./client-sync-history-supabase-gateway"
import { type ClientSyncHistoryGateway } from "./client-sync-history-types"

const mockClientSyncHistoryGateway = createMockClientSyncHistoryGateway()
const supabaseClientSyncHistoryGateway = createSupabaseClientSyncHistoryGateway()

function createDefaultClientSyncHistoryGateway(): ClientSyncHistoryGateway {
  return {
    listHistory() {
      return isErpCatalogMockEnabled()
        ? mockClientSyncHistoryGateway.listHistory()
        : supabaseClientSyncHistoryGateway.listHistory()
    },
    recordMockRun(input) {
      return mockClientSyncHistoryGateway.recordMockRun?.(input) ?? Promise.resolve(null)
    },
  }
}

let clientSyncHistoryGateway: ClientSyncHistoryGateway = createDefaultClientSyncHistoryGateway()

export function getClientSyncHistoryGateway() {
  return clientSyncHistoryGateway
}

export function configureClientSyncHistoryGateway(gateway: ClientSyncHistoryGateway) {
  clientSyncHistoryGateway = gateway
}

export function resetClientSyncHistoryGateway() {
  clientSyncHistoryGateway = createDefaultClientSyncHistoryGateway()
}

export type {
  ClientSyncHistoryGateway,
  RecordMockClientSyncHistoryRunInput,
} from "./client-sync-history-types"
