import { describe, expect, it } from "vitest"

import {
  buildPriceDetails,
  formatPriceCharge,
  getPriceComputedStatus,
  sanitizePriceTable,
  sortPriceTablesByUpdatedAt,
  type PriceTable,
} from "@/features/prices"

function createPriceTable(overrides: Partial<PriceTable> = {}): PriceTable {
  return {
    amount: 20,
    computedStatus: "active",
    cycleHours: 24,
    endsAt: null,
    graceMinutes: 0,
    id: "price-network",
    notes: null,
    parentId: null,
    scope: "network",
    startsAt: "2026-07-01T12:00:00.000Z",
    status: "active",
    tiers: [],
    toleranceMinutes: 0,
    unitId: null,
    unitName: null,
    updatedAt: "2026-07-01T12:00:00.000Z",
    version: 1,
    ...overrides,
  }
}

describe("prices models", () => {
  it("normalizes price tables without mutating tiers", () => {
    const source = createPriceTable({
      amount: 25.5,
      tiers: [{ amount: 12, id: "tier-1", limitHours: 1, notes: null, sequence: 1 }],
    })
    const sanitized = sanitizePriceTable(source)

    expect(sanitized?.amount).toBe(25.5)
    expect(sanitized?.tiers).toEqual(source.tiers)
    expect(sanitized?.tiers).not.toBe(source.tiers)
  })

  it("derives validity status from configured status and date window", () => {
    expect(getPriceComputedStatus(createPriceTable())).toBe("active")
    expect(getPriceComputedStatus(createPriceTable({
      startsAt: "2999-08-01T12:00:00.000Z",
    }))).toBe("scheduled")
    expect(getPriceComputedStatus(createPriceTable({
      endsAt: "2000-07-01T13:00:00.000Z",
    }))).toBe("expired")
    expect(getPriceComputedStatus(createPriceTable({
      status: "inactive",
    }))).toBe("inactive")
  })

  it("sorts by update date and formats charges and tier details", () => {
    const first = createPriceTable({
      id: "price-old",
      updatedAt: "2026-07-01T12:00:00.000Z",
    })
    const second = createPriceTable({
      id: "price-new",
      tiers: [
        { amount: 12, id: "tier-1", limitHours: 1, notes: null, sequence: 1 },
        { amount: 18, id: "tier-2", limitHours: 3, notes: null, sequence: 2 },
      ],
      updatedAt: "2026-07-03T12:00:00.000Z",
    })

    expect(sortPriceTablesByUpdatedAt([first, second]).map((price) => price.id)).toEqual([
      "price-new",
      "price-old",
    ])
    const detailsText = buildPriceDetails(second)
      .map((item) => typeof item.value === "string" ? item.value : "")
      .join(" ")

    expect(formatPriceCharge(second)).toContain("20,00")
    expect(detailsText).toContain("Até 1 hora")
  })
})
