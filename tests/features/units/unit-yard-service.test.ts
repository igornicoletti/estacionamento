import { afterEach, describe, expect, it, vi } from "vitest"

import {
  resetUnitYardGateway,
  setUnitYardGateway,
} from "@/features/units/gateways/unit-yard-gateway"
import { type UnitYardConfigRow } from "@/features/units/schemas/units-gateway-schemas"
import {
  getUnitYardConfig,
  listUnitYardConfigs,
} from "@/features/units/services/unit-yard-service"

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

afterEach(() => {
  resetUnitYardGateway()
})

describe("unit yard service", () => {
  it("returns null when a unit has no yard configuration", async () => {
    configureMemoryYardGateway()

    await expect(getUnitYardConfig("1")).resolves.toBeNull()
  })

  it("maps configured yard data and uses a direct unit lookup", async () => {
    configureMemoryYardGateway([
      {
        parking_spots: 48,
        patio_active: true,
        unit_id: 2,
        updated_at: "2026-07-01T12:00:00.000Z",
      },
    ])

    await expect(listUnitYardConfigs()).resolves.toHaveLength(1)
    await expect(getUnitYardConfig("2")).resolves.toMatchObject({
      parkingSpots: 48,
      patioActive: true,
      unitId: "2",
    })
  })

  it("rejects malformed route identifiers before reaching the gateway", async () => {
    const findConfigByUnitId = vi.fn()
    setUnitYardGateway({
      findConfigByUnitId,
      listConfigs: () => Promise.resolve([]),
    })

    await expect(getUnitYardConfig("not-an-id")).resolves.toBeNull()
    expect(findConfigByUnitId).not.toHaveBeenCalled()
  })
})
