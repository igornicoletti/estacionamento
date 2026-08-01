import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getReportsSnapshotByUnitId } from "@/features/reports/services/reports-service"
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

describe("reports-service", () => {
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

  it("uses Onda Verde yard capacity in occupancy alerts", async () => {
    const snapshot = await getReportsSnapshotByUnitId("7")

    expect(snapshot).toMatchObject({
      unitId: "7",
      unitName: "Onda Verde",
    })
    expect(snapshot.occupancyAlerts[0]).toMatchObject({
      availableSpots: 30,
      capacity: 82,
    })
  })

  it("does not fallback to another unit when an explicit unit has no reports snapshot", async () => {
    await expect(getReportsSnapshotByUnitId("1")).rejects.toThrow(
      "Relatórios sem dados operacionais para a unidade selecionada.",
    )
  })
})
