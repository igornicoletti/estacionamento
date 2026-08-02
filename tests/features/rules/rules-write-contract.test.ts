import { beforeEach, describe, expect, it, vi } from "vitest"

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib")>()

  return {
    ...actual,
    getSupabaseBrowserClient: () => ({ rpc: rpcMock }),
  }
})

import { saveVipRule } from "@/features/rules/services/rules-service"

describe("rules write contract", () => {
  beforeEach(() => {
    rpcMock.mockReset()
    rpcMock.mockResolvedValue({ data: null, error: null })
  })

  it("maps product enums to the database rule enums", async () => {
    await saveVipRule({
      active: true,
      appliesToAllUnits: true,
      benefitHours: 1,
      clientId: null,
      clientName: null,
      fuelMinLiters: 30,
      notes: null,
      targetType: "global",
      type: "fuel",
      unitIds: [],
      vehicleId: null,
      vehicleIds: [],
      vehiclePlate: null,
      yardOccupancyThreshold: null,
      yardStaleVehicleHours: null,
    })

    expect(rpcMock).toHaveBeenCalledWith(
      "save_commercial_rule_version",
      expect.objectContaining({
        p_target_type: "network",
        p_type: "fuel_benefit",
      }),
    )
  })
})
