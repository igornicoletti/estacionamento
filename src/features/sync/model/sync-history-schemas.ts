import { z } from "zod"

export const syncRunModeSchema = z.enum(["full", "incremental"] as const)
export const syncRunTriggerSchema = z.enum(["automatic", "manual"] as const)
export const syncRunStatusSchema = z.enum(["success", "warning", "failed"] as const)
export const syncCountersSchema = z.record(z.string(), z.number())

export const syncHistoryEntrySchema = z.object({
  consecutiveFailures: z.number(),
  counters: syncCountersSchema,
  durationSeconds: z.number().nullable(),
  errorDetails: z.array(z.string()),
  finishedAt: z.string().nullable(),
  id: z.string(),
  message: z.string(),
  mode: syncRunModeSchema,
  startedAt: z.string(),
  status: syncRunStatusSchema,
  trigger: syncRunTriggerSchema,
})

export const syncHistoryCounterSchema = z.object({
  label: z.string(),
  value: z.number(),
})

export type SyncRunMode = "full" | "incremental"
export type SyncRunTrigger = "automatic" | "manual"
export type SyncRunStatus = "success" | "warning" | "failed"
export type SyncCounters = Record<string, number>
export interface SyncHistoryEntry {
  id: string
  mode: SyncRunMode
  trigger: SyncRunTrigger
  status: SyncRunStatus
  startedAt: string
  finishedAt: string | null
  durationSeconds: number | null
  message: string
  counters: SyncCounters
  consecutiveFailures: number
  errorDetails: readonly string[]
}
export interface SyncHistoryCounter {
  label: string
  value: number
}

export type SyncHistoryEntryLike = Omit<SyncHistoryEntry, "counters"> & {
  counters: Record<string, number>
}
