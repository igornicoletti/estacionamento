import { describe, expect, it } from "vitest"

import {
  formatPriceCharge,
  getPriceComputedStatus,
  sanitizePriceTable,
  sortPriceTablesByUpdatedAt,
} from "@/features/prices"

describe("prices models", () => {
  it("normalizes valid price tables without accepting incomplete unit scoped records", () => {
    const valid = sanitizePriceTable({
      amount: "25.50",
      cycleHours: 24,
      graceMinutes: 15,
      id: "price-001",
      scope: "network",
      startsAt: "2026-07-01T12:00:00.000Z",
      status: "active",
      toleranceMinutes: 10,
      updatedAt: "2026-07-02T12:00:00.000Z",
      version: 1,
    })
    const invalidUnit = sanitizePriceTable({
      ...valid,
      id: "price-002",
      scope: "unit",
      unitId: "",
    })

    expect(valid?.amount).toBe(25.5)
    expect(invalidUnit).toBeNull()
  })

  it("derives validity status from configured status and date window", () => {
    const base = {
      amount: 10,
      cycleHours: 1,
      graceMinutes: 0,
      id: "price-001",
      scope: "network" as const,
      startsAt: "2026-07-01T12:00:00.000Z",
      status: "active" as const,
      toleranceMinutes: 0,
      updatedAt: "2026-07-02T12:00:00.000Z",
      version: 1,
    }

    expect(
      getPriceComputedStatus({ ...base, endsAt: null }, new Date("2026-07-02T12:00:00.000Z"))
    ).toBe("active")
    expect(
      getPriceComputedStatus({ ...base, endsAt: null, startsAt: "2026-08-01T12:00:00.000Z" }, new Date("2026-07-02T12:00:00.000Z"))
    ).toBe("scheduled")
    expect(
      getPriceComputedStatus({ ...base, endsAt: "2026-07-01T13:00:00.000Z" }, new Date("2026-07-02T12:00:00.000Z"))
    ).toBe("expired")
  })

  it("sorts by update date and formats tiered charges", () => {
    const first = sanitizePriceTable({
      amount: 20,
      cycleHours: 24,
      graceMinutes: 0,
      id: "price-old",
      scope: "network",
      startsAt: "2026-07-01T12:00:00.000Z",
      status: "active",
      toleranceMinutes: 0,
      updatedAt: "2026-07-01T12:00:00.000Z",
      version: 1,
    })
    const second = sanitizePriceTable({
      amount: 20,
      cycleHours: 24,
      graceMinutes: 0,
      id: "price-new",
      scope: "network",
      startsAt: "2026-07-01T12:00:00.000Z",
      status: "active",
      tiers: [
        { amount: 12, id: "tier-1", limitHours: 1, notes: null, sequence: 1 },
        { amount: 18, id: "tier-2", limitHours: 3, notes: null, sequence: 2 },
      ],
      toleranceMinutes: 0,
      updatedAt: "2026-07-03T12:00:00.000Z",
      version: 1,
    })

    expect(sortPriceTablesByUpdatedAt([first!, second!]).map((price) => price.id)).toEqual([
      "price-new",
      "price-old",
    ])
    expect(formatPriceCharge(second!)).toContain("Até 1h")
    expect(formatPriceCharge(second!)).toContain("12,00")
  })
})
