import { describe, expect, it } from "vitest"

import {
  getClientVipStatus,
  getVehicleVipStatus,
  listVipRules,
  toggleClientVip,
  toggleVehicleVip,
} from "@/features/rules"

describe("vip rules service", () => {
  it("persists and resolves client and vehicle vip states locally", async () => {
    const createdClientRule = await toggleClientVip({
      clientId: 1001,
      clientName: "Cliente VIP",
      enabled: true,
    })
    const createdVehicleRule = await toggleVehicleVip({
      clientId: 1001,
      clientName: "Cliente VIP",
      vehicleId: 2002,
      vehiclePlate: "ABC1D23",
      enabled: true,
    })

    const rules = await listVipRules()

    expect(getClientVipStatus({ cod_pessoa: 1001 } as never, rules)).toBe(true)
    expect(
      getVehicleVipStatus({ cod_pessoa: 1001, cod_veiculo: 2002 } as never, rules)
    ).toBe(true)
    expect(rules.some((rule) => rule.id === createdClientRule.id)).toBe(true)
    expect(rules.some((rule) => rule.id === createdVehicleRule.id)).toBe(true)
  })

  it("updates the same client rule instead of creating duplicates", async () => {
    const activeRule = await toggleClientVip({
      clientId: 1001,
      clientName: "Cliente VIP",
      enabled: true,
    })
    const inactiveRule = await toggleClientVip({
      clientId: 1001,
      clientName: "Cliente VIP",
      enabled: false,
    })

    const rules = await listVipRules()

    expect(activeRule.id).toBe("vip-client:1001")
    expect(inactiveRule.id).toBe(activeRule.id)
    expect(rules).toHaveLength(1)
    expect(rules[0].active).toBe(false)
    expect(getClientVipStatus({ cod_pessoa: 1001 } as never, rules)).toBe(false)
  })

  it("does not mark the whole client as VIP when only one vehicle is VIP", async () => {
    await toggleVehicleVip({
      clientId: 1001,
      clientName: "Cliente VIP",
      vehicleId: 2002,
      vehiclePlate: "ABC1D23",
      enabled: true,
    })

    const rules = await listVipRules()

    expect(getClientVipStatus({ cod_pessoa: 1001 } as never, rules)).toBe(false)
    expect(
      getVehicleVipStatus({ cod_pessoa: 1001, cod_veiculo: 2002 } as never, rules)
    ).toBe(true)
  })
})
