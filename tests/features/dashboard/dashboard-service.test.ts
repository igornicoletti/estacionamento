import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getDashboardSnapshotByUnitId } from "@/features/dashboard/services/dashboard-service"
import {
  configureUnitYardGateway,
  resetUnitYardGateway,
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "@/features/units"

function configureMemoryYardGateway(seed: UnitYardConfig[] = []) {
  const store = seed.map((item) => ({ ...item }))

  configureUnitYardGateway({
    async listConfigs() {
      await Promise.resolve()
      return store.map((item) => ({ ...item }))
    },
    async upsertConfig(input: UpsertUnitYardConfigInput) {
      await Promise.resolve()
      const config: UnitYardConfig = {
        parkingSpots: input.parkingSpots,
        patioActive: input.patioActive,
        unitId: input.unitId,
        updatedAt: "2026-07-21T12:00:00.000Z",
      }
      store.push(config)
      return { ...config }
    },
  })
}

describe("dashboard-service", () => {
  beforeEach(() => {
    configureMemoryYardGateway([
      {
        parkingSpots: 82,
        patioActive: true,
        unitId: "7",
        updatedAt: "2026-07-21T12:00:00.000Z",
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
