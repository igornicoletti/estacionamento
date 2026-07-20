import { z } from "zod"

const targetTypeSchema = z.enum(["client", "vehicle", "unit", "global"])

const vipRuleBaseSchema = z
  .object({
    ruleType: z.literal("vip"),
    targetType: targetTypeSchema,
    clientId: z.number().int().positive(),
    clientName: z.string().min(1),
    vehicleId: z.union([z.number().int().positive(), z.null()]),
    vehiclePlate: z.union([z.string(), z.null()]),
    appliesToAllVehicles: z.boolean(),
    vehicleIds: z.array(z.number().int()),
    appliesToAllUnits: z.boolean(),
    unitIds: z.array(z.string()),
    active: z.boolean(),
    notes: z.union([z.string(), z.null()]),
  })
  .passthrough()

const fuelBenefitRuleBaseSchema = z
  .object({
    ruleType: z.literal("fuel_benefit"),
    scope: z.enum(["network", "unit"]),
    unitIds: z.array(z.string()),
    fuelMinLiters: z.number().positive(),
    benefitHours: z.number().positive(),
    active: z.boolean(),
    notes: z.union([z.string(), z.null()]),
  })
  .passthrough()

const yardCleaningRuleBaseSchema = z
  .object({
    ruleType: z.literal("yard_cleaning"),
    unitIds: z.array(z.string()).min(1),
    yardOccupancyThreshold: z.number().min(1).max(100),
    yardStaleVehicleHours: z.number().positive(),
    active: z.boolean(),
    notes: z.union([z.string(), z.null()]),
  })
  .passthrough()

export const vipRuleFormSchema = vipRuleBaseSchema
export const fuelBenefitRuleFormSchema = fuelBenefitRuleBaseSchema
export const commercialRuleFormSchema = z.discriminatedUnion("ruleType", [
  vipRuleBaseSchema,
  fuelBenefitRuleBaseSchema,
  yardCleaningRuleBaseSchema,
])
