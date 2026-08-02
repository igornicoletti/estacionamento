
export function normalizeNotificationLimit(value: number | undefined) {
  if (value === undefined) {
    return 6
  }

  if (!Number.isFinite(value)) {
    return 6
  }

  return Math.min(20, Math.max(1, Math.floor(value)))
}

export function formatNotificationBadge(count: number) {
  if (!Number.isFinite(count) || count <= 0) {
    return null
  }

  return count > 99 ? "+99" : String(Math.floor(count))
}
