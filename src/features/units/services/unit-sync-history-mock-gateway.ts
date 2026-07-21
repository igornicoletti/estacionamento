import { mockErpUnitsPayload } from "@/features/erp-mock"

import { UNIT_SYNC_HISTORY_CACHE_KEY } from "../constants/units-persistence"
import {
  UNIT_SYNC_FAILED_STATUS,
  UNIT_SYNC_HISTORY_MOCK_STORAGE_SUFFIX,
  UNIT_SYNC_MOCK_RUN_ID_PREFIX,
} from "../constants/units-sync"
import { type UnitSyncHistoryEntry } from "../model"
import {
  limitUnitSyncHistoryEntries,
  parseStoredUnitSyncHistory,
} from "./unit-sync-history-normalization"
import { type RecordMockUnitSyncHistoryRunInput, type UnitSyncHistoryGateway } from "./unit-sync-history-types"

const unitSyncHistoryMockStorageKey = `${UNIT_SYNC_HISTORY_CACHE_KEY}:${UNIT_SYNC_HISTORY_MOCK_STORAGE_SUFFIX}`
const mockSyncHistoryMemoryStore: UnitSyncHistoryEntry[] = []

function syncMemoryHistory(entries: readonly UnitSyncHistoryEntry[]) {
  mockSyncHistoryMemoryStore.splice(
    0,
    mockSyncHistoryMemoryStore.length,
    ...limitUnitSyncHistoryEntries(entries)
  )
}

function readStoredMockHistory(): UnitSyncHistoryEntry[] {
  if (typeof window === "undefined") {
    return limitUnitSyncHistoryEntries(mockSyncHistoryMemoryStore)
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(unitSyncHistoryMockStorageKey) ?? "[]")
    const entries = parseStoredUnitSyncHistory(parsed)

    syncMemoryHistory(entries)

    return entries
  } catch {
    return limitUnitSyncHistoryEntries(mockSyncHistoryMemoryStore)
  }
}

function writeStoredMockHistory(entries: readonly UnitSyncHistoryEntry[]) {
  const limitedEntries = limitUnitSyncHistoryEntries(entries)

  syncMemoryHistory(limitedEntries)

  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(unitSyncHistoryMockStorageKey, JSON.stringify(limitedEntries))
  } catch {
    window.localStorage.removeItem(unitSyncHistoryMockStorageKey)
  }
}

function createMockHistoryEntry(input: RecordMockUnitSyncHistoryRunInput): UnitSyncHistoryEntry {
  const now = new Date().toISOString()
  const received = mockErpUnitsPayload.length
  const hasFailed = input.result.status === UNIT_SYNC_FAILED_STATUS

  return {
    id: input.result.runId ?? `${UNIT_SYNC_MOCK_RUN_ID_PREFIX}-${Date.now()}`,
    mode: input.mode,
    trigger: input.trigger,
    status: input.result.status,
    startedAt: now,
    finishedAt: now,
    durationSeconds: 0,
    message: input.result.message,
    counters: {
      received,
      created: 0,
      updated: 0,
      unchanged: hasFailed ? 0 : received,
      failed: hasFailed ? 1 : 0,
    },
    consecutiveFailures: hasFailed ? 1 : 0,
    errorDetails: [],
  }
}

export function createMockUnitSyncHistoryGateway(): UnitSyncHistoryGateway {
  return {
    async listHistory() {
      await Promise.resolve()

      return readStoredMockHistory()
    },
    async recordMockRun(input) {
      await Promise.resolve()

      const entry = createMockHistoryEntry(input)
      const entries = limitUnitSyncHistoryEntries([entry, ...readStoredMockHistory()])

      writeStoredMockHistory(entries)

      return entry
    },
  }
}
