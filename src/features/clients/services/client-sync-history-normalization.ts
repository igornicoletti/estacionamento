import { z } from "zod"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENTS_SYNC_HISTORY_LIMIT } from "../constants/clients-persistence"
import {
  CLIENT_SYNC_RUN_MODES,
  CLIENT_SYNC_STATUSES,
  CLIENT_SYNC_SUCCESS_STATUS,
  CLIENT_SYNC_TRIGGERS,
} from "../constants/clients-sync"
import { type ClientSyncHistoryEntry, type ClientSyncStatus } from "../model"

const clientSyncModeSchema = z.enum(CLIENT_SYNC_RUN_MODES)
const clientSyncTriggerSchema = z.enum(CLIENT_SYNC_TRIGGERS)
const clientSyncStatusSchema = z.enum(CLIENT_SYNC_STATUSES)
const clientSyncCountersSchema = z.object({
  clientsCreated: z.number(),
  clientsFailed: z.number(),
  clientsReceived: z.number(),
  clientsRejected: z.number(),
  clientsUnchanged: z.number(),
  clientsUpdated: z.number(),
  vehiclesCreated: z.number(),
  vehiclesFailed: z.number(),
  vehiclesReceived: z.number(),
  vehiclesRejected: z.number(),
  vehiclesUnchanged: z.number(),
  vehiclesUpdated: z.number(),
})

const rawClientSyncRunRowSchema = z.object({
  id: z.string().trim().min(1),
  mode: clientSyncModeSchema,
  trigger: clientSyncTriggerSchema,
  status: clientSyncStatusSchema,
  started_at: z.string().trim().min(1),
  finished_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  message: z.string(),
  counters_clients_received: z.number(),
  counters_clients_created: z.number(),
  counters_clients_updated: z.number(),
  counters_clients_unchanged: z.number(),
  counters_clients_failed: z.number(),
  counters_clients_rejected: z.number().optional().default(0),
  counters_vehicles_received: z.number(),
  counters_vehicles_created: z.number(),
  counters_vehicles_updated: z.number(),
  counters_vehicles_unchanged: z.number(),
  counters_vehicles_failed: z.number(),
  counters_vehicles_rejected: z.number().optional().default(0),
  consecutive_failures: z.number(),
  error_details: z.unknown(),
})

const clientSyncHistoryEntrySchema = z.object({
  consecutiveFailures: z.number(),
  counters: clientSyncCountersSchema,
  durationSeconds: z.number().nullable(),
  errorDetails: z.array(z.string()),
  finishedAt: z.string().nullable(),
  id: z.string().trim().min(1),
  message: z.string(),
  mode: clientSyncModeSchema,
  startedAt: z.string().trim().min(1),
  status: clientSyncStatusSchema,
  trigger: clientSyncTriggerSchema,
})

const supabaseResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z.unknown().nullable(),
}).passthrough()

const rawClientSyncRunRowsSchema = z.array(rawClientSyncRunRowSchema)
const clientSyncHistoryEntriesSchema = z.array(clientSyncHistoryEntrySchema)

type RawClientSyncRunRow = z.infer<typeof rawClientSyncRunRowSchema>

function normalizeSyncHistoryMessage(message: string, status: ClientSyncStatus) {
  const value = message.trim()

  if (value) {
    return value
  }

  return status === CLIENT_SYNC_SUCCESS_STATUS
    ? clientsCopy.sync.feedback.success
    : clientsCopy.sync.feedback.error
}

function normalizeSyncErrorDetails(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
}

function mapClientSyncHistory(row: RawClientSyncRunRow): ClientSyncHistoryEntry {
  return {
    consecutiveFailures: row.consecutive_failures,
    counters: {
      clientsCreated: row.counters_clients_created,
      clientsFailed: row.counters_clients_failed,
      clientsReceived: row.counters_clients_received,
      clientsRejected: row.counters_clients_rejected,
      clientsUnchanged: row.counters_clients_unchanged,
      clientsUpdated: row.counters_clients_updated,
      vehiclesCreated: row.counters_vehicles_created,
      vehiclesFailed: row.counters_vehicles_failed,
      vehiclesReceived: row.counters_vehicles_received,
      vehiclesRejected: row.counters_vehicles_rejected,
      vehiclesUnchanged: row.counters_vehicles_unchanged,
      vehiclesUpdated: row.counters_vehicles_updated,
    },
    durationSeconds: row.duration_seconds,
    errorDetails: normalizeSyncErrorDetails(row.error_details),
    finishedAt: row.finished_at,
    id: row.id,
    message: normalizeSyncHistoryMessage(row.message, row.status),
    mode: row.mode,
    startedAt: row.started_at,
    status: row.status,
    trigger: row.trigger,
  }
}

export function sortClientSyncHistoryEntries(entries: readonly ClientSyncHistoryEntry[]) {
  return [...entries].sort((left, right) => right.startedAt.localeCompare(left.startedAt))
}

export function limitClientSyncHistoryEntries(entries: readonly ClientSyncHistoryEntry[]) {
  return sortClientSyncHistoryEntries(entries).slice(0, CLIENTS_SYNC_HISTORY_LIMIT)
}

export function parseSupabaseClientSyncHistoryResponse(value: unknown) {
  const result = supabaseResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(clientsCopy.sync.historyLoadError, { cause: result.error })
  }

  if (result.data.error) {
    throw new Error(clientsCopy.sync.historyLoadError, { cause: result.data.error })
  }

  return result.data.data
}

export function parseClientSyncHistoryRows(value: unknown) {
  const result = rawClientSyncRunRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(clientsCopy.sync.historyLoadError, { cause: result.error })
  }

  return limitClientSyncHistoryEntries(result.data.map(mapClientSyncHistory))
}

export function parseStoredClientSyncHistory(value: unknown) {
  const result = clientSyncHistoryEntriesSchema.safeParse(value)

  if (!result.success) {
    return []
  }

  return limitClientSyncHistoryEntries(result.data)
}
