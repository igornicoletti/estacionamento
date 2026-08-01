import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getDashboardSnapshotByUnitId } from "@/features/dashboard/services/dashboard-service"
import {
  resetUnitYardGateway,
  setUnitYardGateway,
} from "@/features/units/gateways/unit-yard-gateway"
import { type UnitYardConfigRow } from "@/features/units/schemas/units-gateway-schemas"

function configureMemoryYardGateway(seed: UnitYardConfigRow[] = []) {
  const store = seed.map((item) => ({ ...item }))

  setUnitYardGateway({
    async findConfigByUnitId(unitId) {
      await Promise.resolve()
      return store.find((item) => String(item.unit_id) === unitId) ?? null
    },
    async listConfigs() {
      await Promise.resolve()
      return store.map((item) => ({ ...item }))
    },
  })
}

describe("dashboard-service", () => {
  beforeEach(() => {
    configureMemoryYardGateway([
      {
        parking_spots: 82,
        patio_active: true,
        unit_id: 7,
        updated_at: "2026-07-21T12:00:00.000Z",
      },
    ])
  })

  afterEach(() => {
    resetUnitYardGateway()
  })

  it("uses Onda Verde yard capacity from unit configuration", async () => {
    const snapshot = await getDashboardSnapshotByUnitId("7")

    expect(snapshot).toMatchObject({
      parkingCapacity: 82,
      unitId: "7",
      unitName: "Onda Verde",
    })
    expect(
      snapshot.indicators.find((item) => item.id === "occupancy")?.value,
    ).toBe(60)
  })

  it("does not fallback to another unit when an explicit unit has no operational snapshot", async () => {
    await expect(getDashboardSnapshotByUnitId("1")).rejects.toThrow(
      "Dashboard sem dados operacionais para a unidade selecionada.",
    )
  })
})
