import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getReportsSnapshotByUnitId } from "@/features/reports/services/reports-service"
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

describe("reports-service", () => {
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
