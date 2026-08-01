import { z } from "zod"

const syncModeSchema = z.enum(["full", "incremental"])
const syncTriggerSchema = z.enum(["automatic", "manual"])
const syncStatusSchema = z.enum(["success", "warning", "failed"])
const nonNegativeInteger = z.number().int().nonnegative()
const nullableTimestamp = z.iso.datetime({ offset: true }).nullable()

export const syncPhaseResultSchema = z
  .object({
    message: z.string().trim().min(1).max(500),
    runId: z.uuid().nullable(),
    status: syncStatusSchema,
  })
  .strict()

export const unitSyncRunWireSchema = z
  .object({
    id: z.uuid(),
    mode: syncModeSchema,
    trigger: syncTriggerSchema,
    status: syncStatusSchema,
    started_at: z.iso.datetime({ offset: true }),
    finished_at: nullableTimestamp,
    duration_seconds: nonNegativeInteger.nullable(),
    message: z.string().max(1_000),
    counters_received: nonNegativeInteger,
    counters_created: nonNegativeInteger,
    counters_updated: nonNegativeInteger,
    counters_unchanged: nonNegativeInteger,
    counters_failed: nonNegativeInteger,
  })
  .strict()

const syncMetadataSchema = z
  .object({
    partitionCount: nonNegativeInteger.nullable().optional(),
    partitionIndex: nonNegativeInteger.nullable().optional(),
    scope: z.enum(["clients", "vehicles"]).optional(),
  })
  .passthrough()

export const clientSyncRunWireSchema = z
  .object({
    id: z.uuid(),
    mode: syncModeSchema,
    trigger: syncTriggerSchema,
    status: syncStatusSchema,
    started_at: z.iso.datetime({ offset: true }),
    finished_at: nullableTimestamp,
    duration_seconds: nonNegativeInteger.nullable(),
    message: z.string().max(1_000),
    counters_clients_received: nonNegativeInteger,
    counters_clients_created: nonNegativeInteger,
    counters_clients_updated: nonNegativeInteger,
    counters_clients_unchanged: nonNegativeInteger,
    counters_clients_failed: nonNegativeInteger,
    counters_clients_rejected: nonNegativeInteger,
    counters_vehicles_received: nonNegativeInteger,
    counters_vehicles_created: nonNegativeInteger,
    counters_vehicles_updated: nonNegativeInteger,
    counters_vehicles_unchanged: nonNegativeInteger,
    counters_vehicles_failed: nonNegativeInteger,
    counters_vehicles_rejected: nonNegativeInteger,
    metadata: syncMetadataSchema,
  })
  .strict()

export const syncStateWireSchema = z
  .object({
    last_cursor: z.string().nullable(),
  })
  .strict()

export const unitSyncRunRowsSchema = z.array(unitSyncRunWireSchema).max(50)
export const clientSyncRunRowsSchema = z.array(clientSyncRunWireSchema).max(50)

export type UnitSyncRunWire = z.infer<typeof unitSyncRunWireSchema>
export type ClientSyncRunWire = z.infer<typeof clientSyncRunWireSchema>
export type SyncStateWire = z.infer<typeof syncStateWireSchema>
