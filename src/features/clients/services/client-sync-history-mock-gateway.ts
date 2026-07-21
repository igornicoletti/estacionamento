import {
  mockErpClientVehiclesPayload,
  mockErpClientsPayload,
} from "@/features/erp-mock"

import { CLIENTS_SYNC_HISTORY_CACHE_KEY } from "../constants/clients-persistence"
import {
  CLIENT_SYNC_FAILED_STATUS,
  CLIENT_SYNC_HISTORY_MOCK_STORAGE_SUFFIX,
  CLIENT_SYNC_MOCK_RUN_ID_PREFIX,
} from "../constants/clients-sync"
import { type ClientSyncHistoryEntry } from "../model"
import {
  limitClientSyncHistoryEntries,
  parseStoredClientSyncHistory,
} from "./client-sync-history-normalization"
import {
  type ClientSyncHistoryGateway,
  type RecordMockClientSyncHistoryRunInput,
} from "./client-sync-history-types"

const clientSyncHistoryMockStorageKey = `${CLIENTS_SYNC_HISTORY_CACHE_KEY}:${CLIENT_SYNC_HISTORY_MOCK_STORAGE_SUFFIX}`
const mockSyncHistoryMemoryStore: ClientSyncHistoryEntry[] = []

function syncMemoryHistory(entries: readonly ClientSyncHistoryEntry[]) {
  mockSyncHistoryMemoryStore.splice(
    0,
    mockSyncHistoryMemoryStore.length,
    ...limitClientSyncHistoryEntries(entries)
  )
}

function readStoredMockHistory(): ClientSyncHistoryEntry[] {
  if (typeof window === "undefined") {
    return limitClientSyncHistoryEntries(mockSyncHistoryMemoryStore)
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(clientSyncHistoryMockStorageKey) ?? "[]")
    const entries = parseStoredClientSyncHistory(parsed)

    syncMemoryHistory(entries)

    return entries
  } catch {
    return limitClientSyncHistoryEntries(mockSyncHistoryMemoryStore)
  }
}

function writeStoredMockHistory(entries: readonly ClientSyncHistoryEntry[]) {
  const limitedEntries = limitClientSyncHistoryEntries(entries)

  syncMemoryHistory(limitedEntries)

  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(clientSyncHistoryMockStorageKey, JSON.stringify(limitedEntries))
  } catch {
    window.localStorage.removeItem(clientSyncHistoryMockStorageKey)
  }
}

function createMockHistoryEntry(input: RecordMockClientSyncHistoryRunInput): ClientSyncHistoryEntry {
  const now = new Date().toISOString()
  const clientsReceived = mockErpClientsPayload.length
  const vehiclesReceived = mockErpClientVehiclesPayload.length
  const hasFailed = input.result.status === CLIENT_SYNC_FAILED_STATUS

  return {
    consecutiveFailures: hasFailed ? 1 : 0,
    counters: {
      clientsCreated: 0,
      clientsFailed: hasFailed ? 1 : 0,
      clientsReceived,
      clientsRejected: 0,
      clientsUnchanged: hasFailed ? 0 : clientsReceived,
      clientsUpdated: 0,
      vehiclesCreated: 0,
      vehiclesFailed: hasFailed ? 1 : 0,
      vehiclesReceived,
      vehiclesRejected: 0,
      vehiclesUnchanged: hasFailed ? 0 : vehiclesReceived,
      vehiclesUpdated: 0,
    },
    durationSeconds: 0,
    errorDetails: [],
    finishedAt: now,
    id: input.result.runId ?? `${CLIENT_SYNC_MOCK_RUN_ID_PREFIX}-${Date.now()}`,
    message: input.result.message,
    mode: input.mode,
    startedAt: now,
    status: input.result.status,
    trigger: input.trigger,
  }
}

export function createMockClientSyncHistoryGateway(): ClientSyncHistoryGateway {
  return {
    async listHistory() {
      await Promise.resolve()

      return readStoredMockHistory()
    },
    async recordMockRun(input) {
      await Promise.resolve()

      const entry = createMockHistoryEntry(input)
      const entries = limitClientSyncHistoryEntries([entry, ...readStoredMockHistory()])

      writeStoredMockHistory(entries)

      return entry
    },
  }
}
