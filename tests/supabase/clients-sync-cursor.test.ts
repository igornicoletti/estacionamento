import { describe, expect, it } from "vitest"

import {
  isVehicleSyncCursorExpired,
  parseVehicleSyncCursor,
  serializeVehicleSyncCursor,
  type VehicleSyncCursor,
} from "../../supabase/functions/clients-sync/sync-cursor"

const cursor: VehicleSyncCursor = {
  batchStartedAt: "2026-08-01T07:00:00.000Z",
  checkpoint: null,
  kind: "vehicle_partitions",
  mode: "full",
  nextPartition: 0,
  partitionCount: 8,
  requestedBy: null,
  trigger: "automatic",
  version: 1,
}

describe("clients sync cursor", () => {
  it("round-trips a valid vehicle cursor", () => {
    expect(parseVehicleSyncCursor(serializeVehicleSyncCursor(cursor))).toEqual(cursor)
  })

  it("rejects corrupt and out-of-range cursors", () => {
    expect(parseVehicleSyncCursor("not-json")).toBeNull()
    expect(parseVehicleSyncCursor(JSON.stringify({ ...cursor, nextPartition: 8 }))).toBeNull()
    expect(parseVehicleSyncCursor(JSON.stringify({ ...cursor, partitionCount: 0 }))).toBeNull()
  })

  it("expires abandoned batches after two hours", () => {
    expect(isVehicleSyncCursorExpired(cursor, Date.parse("2026-08-01T08:59:59.000Z"))).toBe(false)
    expect(isVehicleSyncCursorExpired(cursor, Date.parse("2026-08-01T09:00:01.000Z"))).toBe(true)
  })
})
