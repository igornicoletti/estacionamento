import { describe, expect, it } from "vitest"

import {
  DEFAULT_VEHICLE_PARTITION_COUNT,
  resolveVehiclePartitionIndex,
} from "../../supabase/functions/clients-sync/vehicle-partition"

describe("clients sync vehicle partitioning", () => {
  it("keeps normalized occurrences of a plate in the same partition", () => {
    expect(resolveVehiclePartitionIndex("abc1d23", 8)).toBe(
      resolveVehiclePartitionIndex(" ABC1D23 ", 8)
    )
  })

  it("always returns a bounded partition", () => {
    for (const plate of ["ABC1D23", "XYZ9A87", "BRA2E19", "DEF4G56"]) {
      const partition = resolveVehiclePartitionIndex(
        plate,
        DEFAULT_VEHICLE_PARTITION_COUNT
      )

      expect(partition).toBeGreaterThanOrEqual(0)
      expect(partition).toBeLessThan(DEFAULT_VEHICLE_PARTITION_COUNT)
    }
  })

  it("routes malformed empty plates to the validation partition", () => {
    expect(resolveVehiclePartitionIndex("", 8)).toBe(0)
  })

  it("rejects invalid partition counts", () => {
    expect(() => resolveVehiclePartitionIndex("ABC1D23", 0)).toThrow(
      "invalid_vehicle_partition_count"
    )
  })
})
