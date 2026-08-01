export const DEFAULT_VEHICLE_PARTITION_COUNT = 8

/**
 * Assigns every occurrence of a plate to the same bounded partition. Keeping
 * duplicate plates together preserves deterministic canonicalization while
 * limiting normalization and upsert work per Edge invocation.
 */
export function resolveVehiclePartitionIndex(plate: string, partitionCount: number) {
  if (!Number.isInteger(partitionCount) || partitionCount < 1) {
    throw new Error("invalid_vehicle_partition_count")
  }

  const normalizedPlate = plate.trim().toUpperCase()

  if (!normalizedPlate) {
    return 0
  }

  let hash = 2_166_136_261

  for (let index = 0; index < normalizedPlate.length; index += 1) {
    hash ^= normalizedPlate.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }

  return (hash >>> 0) % partitionCount
}
