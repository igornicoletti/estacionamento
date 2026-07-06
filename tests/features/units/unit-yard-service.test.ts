import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import { listAuditEvents } from "@/features/audit"
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
    window.localStorage.clear()
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

    const auditEvents = await listAuditEvents()
    expect(auditEvents.some((event) => event.action === "unit.yard_updated")).toBe(true)
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
      async saveAll(configs) {
        await Promise.resolve()
        store.length = 0
        store.push(...(configs as never[]))
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
