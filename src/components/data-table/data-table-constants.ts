export const DATA_TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export type DataTablePageSize =
  (typeof DATA_TABLE_PAGE_SIZE_OPTIONS)[number]

export const DATA_TABLE_INITIAL_PAGE_SIZE =
  25 satisfies DataTablePageSize

interface DataTableSkeletonConfig {
  readonly minRows: number
  readonly maxRows: number
  readonly fallbackRows: number
}

export const DATA_TABLE_SKELETON = {
  minRows: 3,
  maxRows: 8,
  fallbackRows: 5,
} as const satisfies DataTableSkeletonConfig

export function resolveDataTableSkeletonRowCount(
  pageSize?: number | null
): number {
  const { minRows, maxRows, fallbackRows } = DATA_TABLE_SKELETON

  if (typeof pageSize !== "number" || !Number.isFinite(pageSize)) {
    return fallbackRows
  }

  const normalizedPageSize = Math.trunc(pageSize)

  if (normalizedPageSize <= 0) {
    return fallbackRows
  }

  return Math.min(maxRows, Math.max(minRows, normalizedPageSize))
}
