import { afterEach, describe, expect, it, vi } from "vitest"

import { usersCopy } from "@/features/users/constants/users-copy"
import {
  hasRecentUserAccess,
  resolveRecentAccessLabel,
} from "@/features/users/model/users-models"

describe("users models", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("labels a recent sign-in without claiming real-time presence", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-31T12:00:00.000Z"))

    expect(hasRecentUserAccess("2026-07-31T11:50:00.000Z")).toBe(true)
    expect(resolveRecentAccessLabel("2026-07-31T11:50:00.000Z")).toBe(
      usersCopy.filters.recentAccessValue
    )
  })

  it("degrades old or malformed timestamps to no recent access", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-31T12:00:00.000Z"))

    expect(hasRecentUserAccess("2026-07-31T11:44:59.000Z")).toBe(false)
    expect(hasRecentUserAccess("2026-07-31T12:00:01.000Z")).toBe(false)
    expect(hasRecentUserAccess("invalid-date")).toBe(false)
    expect(resolveRecentAccessLabel(null)).toBe(
      usersCopy.filters.noRecentAccessValue
    )
  })
})
