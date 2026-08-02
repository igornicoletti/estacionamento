import { describe, expect, it } from "vitest"

import { getSecurityScoreTone } from "@/features/security/model/security-models"

describe("getSecurityScoreTone", () => {
  it.each([
    { completed: 2, expected: "error", value: 33 },
    { completed: 3, expected: "warning", value: 50 },
    { completed: 5, expected: "warning", value: 83 },
    { completed: 6, expected: "success", value: 100 },
  ] as const)(
    "maps $completed completed measures to $expected",
    ({ completed, expected, value }) => {
      expect(
        getSecurityScoreTone({
          completed,
          remaining: 6 - completed,
          total: 6,
          value,
        })
      ).toBe(expected)
    }
  )
})
