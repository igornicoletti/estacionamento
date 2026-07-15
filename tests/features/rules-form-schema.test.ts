import { describe, expect, it } from "vitest"

import {
  commercialRuleFormSchema,
  fuelBenefitRuleFormSchema,
  vipRuleFormSchema,
} from "@/features/rules/schemas/rules-form-schema"

describe("rules-form-schema", () => {
  describe("vip rule", () => {
    const validVip = {
      ruleType: "vip" as const,
      targetType: "client" as const,
      clientId: 1001,
      clientName: "Cliente Teste",
      vehicleId: null,
      vehiclePlate: null,
      appliesToAllVehicles: true,
      vehicleIds: [],
      appliesToAllUnits: true,
      unitIds: [],
      active: true,
      reason: "Cliente preferencial da rede",
      notes: null,
    }

    it("accepts valid VIP rule", () => {
      expect(vipRuleFormSchema.safeParse(validVip).success).toBe(true)
    })

    it("rejects missing clientId", () => {
      const result = vipRuleFormSchema.safeParse({ ...validVip, clientId: -1 })
      expect(result.success).toBe(false)
    })

    it("rejects short reason", () => {
      const result = vipRuleFormSchema.safeParse({ ...validVip, reason: "curta" })
      expect(result.success).toBe(false)
    })

    it("rejects missing clientName", () => {
      const result = vipRuleFormSchema.safeParse({ ...validVip, clientName: "" })
      expect(result.success).toBe(false)
    })
  })

  describe("fuel benefit rule", () => {
    const validFuel = {
      ruleType: "fuel_benefit" as const,
      scope: "network" as const,
      unitIds: [],
      fuelMinLiters: 50,
      benefitHours: 2,
      active: true,
      reason: "Benefício de horas grátis para abastecimento",
      notes: null,
    }

    it("accepts valid fuel benefit rule", () => {
      expect(fuelBenefitRuleFormSchema.safeParse(validFuel).success).toBe(true)
    })

    it("rejects zero liters", () => {
      const result = fuelBenefitRuleFormSchema.safeParse({
        ...validFuel,
        fuelMinLiters: 0,
      })
      expect(result.success).toBe(false)
    })

    it("rejects zero benefit hours", () => {
      const result = fuelBenefitRuleFormSchema.safeParse({
        ...validFuel,
        benefitHours: 0,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("discriminated union", () => {
    it("accepts VIP rule via discriminated union", () => {
      const result = commercialRuleFormSchema.safeParse({
        ruleType: "vip",
        targetType: "client",
        clientId: 100,
        clientName: "Teste",
        vehicleId: null,
        vehiclePlate: null,
        appliesToAllVehicles: true,
        vehicleIds: [],
        appliesToAllUnits: true,
        unitIds: [],
        active: true,
        reason: "VIP para testes automatizados",
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it("accepts fuel benefit rule via discriminated union", () => {
      const result = commercialRuleFormSchema.safeParse({
        ruleType: "fuel_benefit",
        scope: "network",
        unitIds: [],
        fuelMinLiters: 30,
        benefitHours: 1,
        active: true,
        reason: "Benefício padrão para abastecimento",
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it("accepts yard cleaning rule via discriminated union", () => {
      const result = commercialRuleFormSchema.safeParse({
        ruleType: "yard_cleaning",
        unitIds: ["1"],
        yardOccupancyThreshold: 80,
        yardStaleVehicleHours: 24,
        active: true,
        reason: "Alerta de limpeza do pátio",
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it("rejects yard cleaning without unitIds", () => {
      const result = commercialRuleFormSchema.safeParse({
        ruleType: "yard_cleaning",
        unitIds: [],
        yardOccupancyThreshold: 80,
        yardStaleVehicleHours: 24,
        active: true,
        reason: "Alerta de limpeza do pátio",
        notes: null,
      })
      expect(result.success).toBe(false)
    })
  })
})
