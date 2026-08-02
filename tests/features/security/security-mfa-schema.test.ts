import { describe, expect, it } from "vitest"

import { securityMfaCodeSchema } from "@/features/security/schemas/security-mfa-schema"

describe("securityMfaCodeSchema", () => {
  it("accepts exactly six digits", () => {
    expect(securityMfaCodeSchema.safeParse("123456").success).toBe(true)
  })

  it.each(["", "12345", "1234567", "12A456"])(
    "rejects invalid code %j",
    (code) => {
      expect(securityMfaCodeSchema.safeParse(code).success).toBe(false)
    }
  )
})
