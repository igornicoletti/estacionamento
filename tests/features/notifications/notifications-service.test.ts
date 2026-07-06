import { afterEach, describe, expect, it } from "vitest"

import {
  countUnreadNotifications,
  listNotifications,
  resetNotificationsMockState,
  setNotificationsStatus,
} from "@/features/notifications"

afterEach(() => {
  resetNotificationsMockState()
})

describe("notifications-service", () => {
  it("updates unread notifications in batch and reports summary", async () => {
    const beforeUnread = await countUnreadNotifications()

    expect(beforeUnread).toBeGreaterThan(0)

    const current = await listNotifications()
    const unreadIds = current
      .filter((notification) => notification.status === "unread")
      .map((notification) => notification.id)

    const result = await setNotificationsStatus(unreadIds, "read")

    expect(result.total).toBe(unreadIds.length)
    expect(result.failed).toEqual([])
    expect(result.updated).toBe(unreadIds.length)
    await expect(countUnreadNotifications()).resolves.toBe(0)
  })

  it("keeps working when batch contains repeated or invalid ids", async () => {
    const result = await setNotificationsStatus([
      "N-001",
      "N-001",
      "N-404",
    ], "read")

    expect(result.total).toBe(2)
    expect(result.updated).toBe(1)
    expect(result.failed).toEqual(["N-404"])
  })
})
