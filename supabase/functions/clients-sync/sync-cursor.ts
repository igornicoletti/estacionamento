export type CursorSyncMode = "full" | "incremental"
export type CursorSyncTrigger = "automatic" | "manual"

export interface VehicleSyncCursor {
  batchStartedAt: string
  checkpoint: string | null
  kind: "vehicle_partitions"
  mode: CursorSyncMode
  nextPartition: number
  partitionCount: number
  requestedBy: string | null
  trigger: CursorSyncTrigger
  version: 1
}

const maxCursorAgeMs = 2 * 60 * 60 * 1000

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

export function parseVehicleSyncCursor(value: string | null): VehicleSyncCursor | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    const batchTimestamp = typeof parsed.batchStartedAt === "string"
      ? Date.parse(parsed.batchStartedAt)
      : Number.NaN

    if (
      parsed.version !== 1 ||
      parsed.kind !== "vehicle_partitions" ||
      (parsed.mode !== "full" && parsed.mode !== "incremental") ||
      (parsed.trigger !== "automatic" && parsed.trigger !== "manual") ||
      !Number.isFinite(batchTimestamp) ||
      !Number.isInteger(parsed.partitionCount) ||
      Number(parsed.partitionCount) < 1 ||
      !Number.isInteger(parsed.nextPartition) ||
      Number(parsed.nextPartition) < 0 ||
      Number(parsed.nextPartition) >= Number(parsed.partitionCount) ||
      !isNullableString(parsed.checkpoint) ||
      !isNullableString(parsed.requestedBy)
    ) {
      return null
    }

    return parsed as unknown as VehicleSyncCursor
  } catch {
    return null
  }
}

export function isVehicleSyncCursorExpired(
  cursor: VehicleSyncCursor,
  nowMs = Date.now()
) {
  return nowMs - Date.parse(cursor.batchStartedAt) > maxCursorAgeMs
}

export function serializeVehicleSyncCursor(cursor: VehicleSyncCursor) {
  return JSON.stringify(cursor)
}
