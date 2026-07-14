import { describe, expect, it } from "vitest"

import {
  formatVipRuleUnitScope,
  getClientVipStatus,
  getVehicleVipStatus,
  getVipRuleVehicleScopeLabel,
  isClientVipFromRules,
  isVehicleVipFromRules,
  type VipRule,
} from "@/features/rules"

const clientRule: VipRule = {
  active: true,
  appliesToAllUnits: true,
  appliesToAllVehicles: true,
  clientId: 1001,
  clientName: "Cliente VIP",
  benefitHours: null,
  fuelMinLiters: null,
  id: "vip-client:1001",
  notes: null,
  reason: "Regra administrativa validada.",
  ruleSummary: "Cliente VIP",
  ruleType: "vip",
  scopeLabel: "Todas as unidades",
  targetType: "client",
  unitIds: [],
  updatedAt: "2026-07-01T12:00:00.000Z",
  vehicleId: null,
  vehicleIds: [],
  vehiclePlate: null,
  yardOccupancyThreshold: null,
  yardStaleVehicleHours: null,
}

const vehicleRule: VipRule = {
  ...clientRule,
  appliesToAllVehicles: false,
  id: "vip-vehicle:1001:2002",
  targetType: "vehicle",
  vehicleId: 2002,
  vehicleIds: [2002],
  vehiclePlate: "ABC1D23",
}

describe("vip rules model", () => {
  it("resolves client and vehicle vip states from active rules", () => {
    expect(getClientVipStatus({ cod_pessoa: 1001 } as never, [clientRule])).toBe(true)
    expect(getVehicleVipStatus({ cod_pessoa: 1001, cod_veiculo: 2002 } as never, [clientRule])).toBe(true)
    expect(isClientVipFromRules([vehicleRule], 1001)).toBe(false)
    expect(isVehicleVipFromRules([vehicleRule], 1001, 2002)).toBe(true)
  })

  it("ignores inactive rules and formats scopes for operators", () => {
    const inactive = { ...clientRule, active: false }

    expect(isClientVipFromRules([inactive], 1001)).toBe(false)
    expect(formatVipRuleUnitScope(clientRule)).toBe("Todas as unidades")
    expect(getVipRuleVehicleScopeLabel(vehicleRule)).toBe("ABC1D23")
  })
})
