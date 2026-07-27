import { describe, expect, it } from "vitest"

import { resolveAuthSessionLeaseDeadline } from "@/features/auth/context/auth-inactivity"

describe("auth session lease deadline", () => {
  it("ignores server deadlines while enforcement is disabled", () => {
    expect(
      resolveAuthSessionLeaseDeadline(
        {
          absoluteExpiresAt: "2026-07-28T12:00:00.000Z",
          enforcementEnabled: false,
          idleExpiresAt: "2026-07-27T12:45:00.000Z",
          serverTime: "2026-07-27T12:00:00.000Z",
        },
        Date.parse("2026-07-27T12:00:00.000Z")
      )
    ).toBeNull()
  })

  it("uses the earliest enforced server deadline", () => {
    const now = Date.parse("2026-07-27T12:00:00.000Z")

    expect(
      resolveAuthSessionLeaseDeadline(
        {
          absoluteExpiresAt: "2026-07-28T12:00:00.000Z",
          enforcementEnabled: true,
          idleExpiresAt: "2026-07-27T12:45:00.000Z",
          serverTime: "2026-07-27T12:00:00.000Z",
        },
        now
      )
    ).toBe(now + 45 * 60 * 1000)
  })
})
