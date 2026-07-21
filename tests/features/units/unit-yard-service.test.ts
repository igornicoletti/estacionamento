import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import { type UnitYardConfig, type UpsertUnitYardConfigInput } from "@/features/units/model/units-types"
import {
  configureUnitYardGateway,
  resetUnitYardGateway,
} from "@/features/units/services/unit-yard-gateway"
import {
  getUnitYardConfig,
  listUnitYardConfigs,
  upsertUnitYardConfig,
} from "@/features/units/services/unit-yard-service"

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
        updatedAt: "2026-07-01T12:00:00.000Z",
      }
      const index = store.findIndex((item) => item.unitId === config.unitId)

      if (index >= 0) {
        store[index] = config
      } else {
        store.push(config)
      }

      return { ...config }
    },
  })
}

afterEach(() => {
  resetUnitYardGateway()
})

describe("unit yard service", () => {
  beforeEach(() => {
    configureMemoryYardGateway()
  })

  it("returns null when a unit has no yard configuration", async () => {
    await expect(getUnitYardConfig("1")).resolves.toBeNull()
  })

  it("preserves configured spots when patio is deactivated", async () => {
    await upsertUnitYardConfig({
      parkingSpots: 60,
      patioActive: true,
      unitId: "1",
    })

    const inactiveConfig = await upsertUnitYardConfig({
      parkingSpots: 60,
      patioActive: false,
      unitId: "1",
    })

    expect(inactiveConfig.patioActive).toBe(false)
    expect(inactiveConfig.parkingSpots).toBe(60)

    const persistedConfig = await getUnitYardConfig("1")
    expect(persistedConfig).toMatchObject({
      parkingSpots: 60,
      patioActive: false,
    })
  })

  it("supports gateway override for future persistence providers", async () => {
    configureMemoryYardGateway([
      {
        parkingSpots: 48,
        patioActive: true,
        unitId: "2",
        updatedAt: "2026-07-01T12:00:00.000Z",
      },
    ])

    await expect(listUnitYardConfigs()).resolves.toHaveLength(1)

    const updated = await upsertUnitYardConfig({
      parkingSpots: 32,
      patioActive: false,
      unitId: "2",
    })

    expect(updated.patioActive).toBe(false)
    expect(updated.parkingSpots).toBe(32)
  })
})
