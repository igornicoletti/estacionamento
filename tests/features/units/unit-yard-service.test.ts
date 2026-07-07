import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import {
  configureUnitYardGateway,
  resetUnitYardGateway,
} from "@/features/units/services/unit-yard-gateway"
import {
  getUnitYardConfig,
  listUnitYardConfigs,
  upsertUnitYardConfig,
} from "@/features/units/services/unit-yard-service"

afterEach(() => {
  resetUnitYardGateway()
})

describe("unit yard service", () => {
  beforeEach(() => {
    const store: Array<{
      unitId: string
      patioActive: boolean
      parkingSpots: number
      updatedAt: string
    }> = []

    configureUnitYardGateway({
      async list() {
        await Promise.resolve()
        return [...store]
      },
      async upsertOne(config) {
        await Promise.resolve()
        const index = store.findIndex((item) => item.unitId === config.unitId)

        if (index >= 0) {
          store[index] = config
        } else {
          store.push(config)
        }
      },
    })
  })

  beforeEach(() => {
    // Tests use in-memory gateway fixture.
  })

  it("starts with inactive patio and zero spots by default", async () => {
    const config = await getUnitYardConfig("1")

    expect(config.patioActive).toBe(false)
    expect(config.parkingSpots).toBe(0)
  })

  it("preserves configured spots when patio is deactivated", async () => {
    await upsertUnitYardConfig({
      unitId: "1",
      patioActive: true,
      parkingSpots: 60,
    })

    const inactiveConfig = await upsertUnitYardConfig({
      unitId: "1",
      patioActive: false,
      parkingSpots: 60,
    })

    expect(inactiveConfig.patioActive).toBe(false)
    expect(inactiveConfig.parkingSpots).toBe(60)

    const persistedConfig = await getUnitYardConfig("1")
    expect(persistedConfig.patioActive).toBe(false)
    expect(persistedConfig.parkingSpots).toBe(60)

  })

  it("supports gateway override for future persistence providers", async () => {
    const store = [
      {
        unitId: " 2 ",
        patioActive: true,
        parkingSpots: "48",
        updatedAt: "",
      },
      {
        unitId: "",
        patioActive: true,
        parkingSpots: 10,
        updatedAt: new Date().toISOString(),
      },
    ]

    configureUnitYardGateway({
      async list() {
        await Promise.resolve()
        return store as never[]
      },
      async upsertOne(config) {
        await Promise.resolve()
        const index = store.findIndex((item) => item.unitId === config.unitId)

        if (index >= 0) {
          store[index] = config
        } else {
          store.push(config)
        }
      },
    })

    const configs = await listUnitYardConfigs()

    expect(configs).toHaveLength(1)
    expect(configs[0]).toMatchObject({
      unitId: "2",
      patioActive: true,
      parkingSpots: 48,
    })

    const updated = await upsertUnitYardConfig({
      unitId: "2",
      patioActive: false,
      parkingSpots: 32,
    })

    expect(updated.patioActive).toBe(false)
    expect(updated.parkingSpots).toBe(32)
  })
})
