import { describe, expect, it } from "vitest"

import { auditEventRowSchema } from "@/features/audit/schemas/audit-gateway-schema"
import { createAuditEventRow } from "../../helpers/audit-memory-gateway"

describe("audit gateway schema", () => {
  it("accepts the canonical audit_events wire contract", () => {
    expect(auditEventRowSchema.safeParse(createAuditEventRow()).success).toBe(
      true
    )
  })

  it.each([
    ["invalid id", { id: "not-a-uuid" }],
    ["invalid timestamp", { occurred_at: "not-a-date" }],
    ["invalid scope", { scope: "admin" }],
    ["invalid severity", { severity: "error" }],
    ["blank event", { event: "   " }],
  ])("rejects %s", (_scenario, overrides) => {
    expect(
      auditEventRowSchema.safeParse({
        ...createAuditEventRow(),
        ...overrides,
      }).success
    ).toBe(false)
  })

  it("rejects fields outside the selected wire contract", () => {
    expect(
      auditEventRowSchema.safeParse({
        ...createAuditEventRow(),
        password: "must-not-cross-the-boundary",
      }).success
    ).toBe(false)
  })
})
