import { describe, expect, it } from "vitest"

import {
  formatCurrency,
  formatIntegerUnit,
  normalizePriceTableRecord,
  normalizePriceTableRecords,
  type RawPriceTableRecord,
} from "@/features/prices"

describe("prices model normalization", () => {
  it("normalizes a raw price table into canonical shape", () => {
    const raw: RawPriceTableRecord = {
      amount: "25.5",
      created_at: "2026-07-01T12:00:00.000Z",
      cycle_hours: "24",
      ends_at: null,
      grace_minutes: "15",
      id: "price-global",
      name: "Tabela base",
      notes: "Observacao",
      scope: "global",
      starts_at: "2026-07-01T12:00:00.000Z",
      status: "active",
      tolerance_minutes: "10",
      unit_id: null,
      unit_name: null,
      updated_at: "2026-07-02T12:00:00.000Z",
    }

    const normalized = normalizePriceTableRecord(raw)

    expect(normalized.id).toBe("price-global")
    expect(normalized.scope).toBe("global")
    expect(normalized.amount).toBe(25.5)
    expect(normalized.cycleHours).toBe(24)
    expect(normalized.status).toBe("active")
  })

  it("sorts normalized records by startsAt descending", () => {
    const rows: RawPriceTableRecord[] = [
      {
        amount: 20,
        created_at: null,
        cycle_hours: 24,
        ends_at: null,
        grace_minutes: 0,
        id: "older",
        name: "Tabela antiga",
        notes: null,
        scope: "global",
        starts_at: "2026-07-01T12:00:00.000Z",
        status: "active",
        tolerance_minutes: 0,
        unit_id: null,
        unit_name: null,
        updated_at: null,
      },
      {
        amount: 22,
        created_at: null,
        cycle_hours: 24,
        ends_at: null,
        grace_minutes: 0,
        id: "newer",
        name: "Tabela nova",
        notes: null,
        scope: "global",
        starts_at: "2026-07-03T12:00:00.000Z",
        status: "active",
        tolerance_minutes: 0,
        unit_id: null,
        unit_name: null,
        updated_at: null,
      },
    ]

    const normalized = normalizePriceTableRecords(rows)

    expect(normalized.map((item) => item.id)).toEqual(["newer", "older"])
  })

  it("formats money and integer units for UI", () => {
    expect(formatCurrency(20)).toContain("20")
    expect(formatIntegerUnit(24, "horas")).toContain("24")
  })
})
