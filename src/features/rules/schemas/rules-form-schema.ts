import { z } from "zod"

import { rulesCopy } from "../rules-copy"

const baseRuleFields = {
  active: z.boolean(),
  reason: z
    .string({ error: rulesCopy.form.validation.reason })
    .trim()
    .min(10, { error: rulesCopy.form.validation.reason }),
  notes: z.string().trim().nullable(),
}

export const vipRuleFormSchema = z.object({
  ruleType: z.literal("vip"),
  targetType: z.enum(["client", "vehicle"]),
  clientId: z
    .number({ error: rulesCopy.form.validation.clientId })
    .int()
    .positive({ error: rulesCopy.form.validation.clientId }),
  clientName: z
    .string({ error: rulesCopy.form.validation.clientName })
    .trim()
    .min(1, { error: rulesCopy.form.validation.clientName }),
  vehicleId: z.number().int().nullable(),
  vehiclePlate: z.string().trim().nullable(),
  appliesToAllVehicles: z.boolean(),
  vehicleIds: z.array(z.number().int()),
  appliesToAllUnits: z.boolean(),
  unitIds: z.array(z.string().trim()),
  ...baseRuleFields,
})

export const fuelBenefitRuleFormSchema = z.object({
  ruleType: z.literal("fuel_benefit"),
  scope: z.enum(["network", "unit"]),
  unitIds: z.array(z.string().trim()),
  fuelMinLiters: z
    .number({ error: rulesCopy.form.validation.fuelMinLiters })
    .positive({ error: rulesCopy.form.validation.fuelMinLiters }),
  benefitHours: z
    .number({ error: rulesCopy.form.validation.benefitHours })
    .positive({ error: rulesCopy.form.validation.benefitHours }),
  ...baseRuleFields,
})

export const yardCleaningRuleFormSchema = z.object({
  ruleType: z.literal("yard_cleaning"),
  unitIds: z
    .array(z.string().trim())
    .min(1, { error: rulesCopy.form.validation.unitIds }),
  yardOccupancyThreshold: z
    .number({ error: rulesCopy.form.validation.yardOccupancyThreshold })
    .int()
    .positive({ error: rulesCopy.form.validation.yardOccupancyThreshold }),
  yardStaleVehicleHours: z
    .number({ error: rulesCopy.form.validation.yardStaleVehicleHours })
    .positive({ error: rulesCopy.form.validation.yardStaleVehicleHours }),
  ...baseRuleFields,
})

export const yardCleaningOccupancyRuleFormSchema = z.object({
  ruleType: z.literal("yard_cleaning_occupancy"),
  unitIds: z
    .array(z.string().trim())
    .min(1, { error: rulesCopy.form.validation.unitIds }),
  yardOccupancyThreshold: z
    .number({ error: rulesCopy.form.validation.yardOccupancyThreshold })
    .int()
    .positive({ error: rulesCopy.form.validation.yardOccupancyThreshold }),
  ...baseRuleFields,
})

export const yardCleaningStaleVehicleRuleFormSchema = z.object({
  ruleType: z.literal("yard_cleaning_stale_vehicle"),
  scope: z.enum(["network", "unit"]),
  unitIds: z.array(z.string().trim()),
  yardStaleVehicleHours: z
    .number({ error: rulesCopy.form.validation.yardStaleVehicleHours })
    .positive({ error: rulesCopy.form.validation.yardStaleVehicleHours }),
  ...baseRuleFields,
})

export const commercialRuleFormSchema = z.discriminatedUnion("ruleType", [
  vipRuleFormSchema,
  fuelBenefitRuleFormSchema,
  yardCleaningRuleFormSchema,
  yardCleaningOccupancyRuleFormSchema,
  yardCleaningStaleVehicleRuleFormSchema,
])

export type VipRuleFormValues = z.infer<typeof vipRuleFormSchema>
export type FuelBenefitRuleFormValues = z.infer<typeof fuelBenefitRuleFormSchema>
export type CommercialRuleFormValues = z.infer<typeof commercialRuleFormSchema>
