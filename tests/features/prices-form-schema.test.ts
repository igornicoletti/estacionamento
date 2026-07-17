import { describe, expect, it } from "vitest"

import { priceTableFormSchema } from "@/features/prices/schemas/prices-form-schema"

describe("prices-form-schema", () => {
  const validInput = {
    scope: "network" as const,
    unitId: null,
    unitName: null,
    amount: 15.5,
    cycleHours: 24,
    graceMinutes: 15,
    toleranceMinutes: 10,
    startsAt: new Date(Date.now() + 86_400_000).toISOString(),
    endsAt: null,
    status: "active" as const,
    notes: null,
  }

  it("accepts valid network-scoped input", () => {
    expect(priceTableFormSchema.safeParse(validInput).success).toBe(true)
  })

  it("requires unitId and unitName when scope is unit", () => {
    const unitInput = { ...validInput, scope: "unit" as const }
    const result = priceTableFormSchema.safeParse(unitInput)
    expect(result.success).toBe(false)
  })

  it("accepts valid unit-scoped input", () => {
    const unitInput = {
      ...validInput,
      scope: "unit" as const,
      unitId: "1",
      unitName: "Monte Carlo Centro",
    }
    expect(priceTableFormSchema.safeParse(unitInput).success).toBe(true)
  })

  it("rejects negative amount", () => {
    const result = priceTableFormSchema.safeParse({ ...validInput, amount: -5 })
    expect(result.success).toBe(false)
  })

  it("rejects cycleHours out of range", () => {
    expect(
      priceTableFormSchema.safeParse({ ...validInput, cycleHours: 0 }).success
    ).toBe(false)
    expect(
      priceTableFormSchema.safeParse({ ...validInput, cycleHours: 721 }).success
    ).toBe(false)
  })

  it("rejects graceMinutes above max", () => {
    expect(
      priceTableFormSchema.safeParse({ ...validInput, graceMinutes: 1441 }).success
    ).toBe(false)
  })

  it("rejects toleranceMinutes above max", () => {
    expect(
      priceTableFormSchema.safeParse({ ...validInput, toleranceMinutes: 241 }).success
    ).toBe(false)
  })

  it("rejects empty startsAt", () => {
    expect(
      priceTableFormSchema.safeParse({ ...validInput, startsAt: "" }).success
    ).toBe(false)
  })
})
