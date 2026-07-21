import { z } from "zod"

import { rulesCopy } from "../constants"
import {
  ruleTargetTypeValues,
  ruleTypeValues,
  type RuleTargetType,
  type RuleType,
  type SaveVipRulePayload,
  type VipRuleFormValues,
} from "./rules-types"

export type VipRuleFormErrors = Partial<Record<keyof VipRuleFormValues, string>>

function isRuleType(value: string): value is RuleType {
  return ruleTypeValues.includes(value as RuleType)
}

function isRuleTargetType(value: string): value is RuleTargetType {
  return ruleTargetTypeValues.includes(value as RuleTargetType)
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return null
  }

  const number = Number(value.replace(",", "."))
  return Number.isFinite(number) ? number : null
}

function parseStringList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const vipRuleFormValidationSchema = z
  .object({
    id: z.string().optional(),
    active: z.boolean(),
    appliesToAllUnits: z.boolean(),
    benefitHours: z.number({ error: rulesCopy.validation.positiveNumber }).nullable(),
    clientId: z.number({ error: rulesCopy.validation.invalidClientId }).int({ error: rulesCopy.validation.invalidClientId }).positive({ error: rulesCopy.validation.invalidClientId }).nullable(),
    clientName: z.string(),
    fuelMinLiters: z.number({ error: rulesCopy.validation.positiveNumber }).nullable(),
    notes: z.string(),
    targetType: z.string({ error: rulesCopy.validation.required }).refine(isRuleTargetType, { error: rulesCopy.validation.required }),
    type: z.string({ error: rulesCopy.validation.required }).refine(isRuleType, { error: rulesCopy.validation.required }),
    unitIds: z.array(z.string()),
    vehicleId: z.number({ error: rulesCopy.validation.required }).int({ error: rulesCopy.validation.required }).positive({ error: rulesCopy.validation.required }).nullable(),
    vehiclePlate: z.string(),
    yardOccupancyThreshold: z.number({ error: rulesCopy.validation.percentage }).nullable(),
    yardStaleVehicleHours: z.number({ error: rulesCopy.validation.positiveNumber }).nullable(),
  })
  .superRefine((value, context) => {
    if (value.targetType === "client" && value.clientId === null) {
      context.addIssue({
        code: "custom",
        message: rulesCopy.validation.invalidClientId,
        path: ["clientId"],
      })
    }

    if (value.targetType === "vehicle" && value.vehicleId === null) {
      context.addIssue({
        code: "custom",
        message: rulesCopy.validation.required,
        path: ["vehicleId"],
      })
    }

    if (!value.appliesToAllUnits && value.unitIds.length === 0) {
      context.addIssue({
        code: "custom",
        message: rulesCopy.validation.required,
        path: ["unitIds"],
      })
    }

    if (value.type === "fuel" && (!value.fuelMinLiters || value.fuelMinLiters <= 0)) {
      context.addIssue({
        code: "custom",
        message: rulesCopy.validation.positiveNumber,
        path: ["fuelMinLiters"],
      })
    }

    if (value.type === "vip" && (!value.benefitHours || value.benefitHours <= 0)) {
      context.addIssue({
        code: "custom",
        message: rulesCopy.validation.positiveNumber,
        path: ["benefitHours"],
      })
    }

    if (
      value.type === "yard_cleaning" &&
      (!value.yardOccupancyThreshold || value.yardOccupancyThreshold < 1 || value.yardOccupancyThreshold > 100)
    ) {
      context.addIssue({
        code: "custom",
        message: rulesCopy.validation.percentage,
        path: ["yardOccupancyThreshold"],
      })
    }

    if (value.type === "yard_cleaning" && (!value.yardStaleVehicleHours || value.yardStaleVehicleHours <= 0)) {
      context.addIssue({
        code: "custom",
        message: rulesCopy.validation.positiveNumber,
        path: ["yardStaleVehicleHours"],
      })
    }
  })

function getVipRuleFormErrors(error: z.ZodError): VipRuleFormErrors {
  return error.issues.reduce<VipRuleFormErrors>((errors, issue) => {
    const fieldName = issue.path[0]

    if (typeof fieldName === "string" && fieldName in createEmptyVipRuleFormValues()) {
      errors[fieldName as keyof VipRuleFormValues] = issue.message
    }

    return errors
  }, {})
}

export function createEmptyVipRuleFormValues(): VipRuleFormValues {
  return {
    type: "vip",
    targetType: "client",
    clientId: "",
    clientName: "",
    vehicleId: "",
    vehiclePlate: "",
    unitIds: "",
    appliesToAllUnits: true,
    active: true,
    fuelMinLiters: "",
    benefitHours: "1",
    yardOccupancyThreshold: "",
    yardStaleVehicleHours: "",
    notes: "",
  }
}

export function createVipRuleFormValues(values: Partial<VipRuleFormValues>): VipRuleFormValues {
  return { ...createEmptyVipRuleFormValues(), ...values }
}

export function validateVipRuleForm(values: VipRuleFormValues) {
  const fuelMinLiters = parseNumber(values.fuelMinLiters)
  const benefitHours = parseNumber(values.benefitHours)
  const yardOccupancyThreshold = parseNumber(values.yardOccupancyThreshold)
  const yardStaleVehicleHours = parseNumber(values.yardStaleVehicleHours)

  const result = vipRuleFormValidationSchema.safeParse({
    id: values.id,
    active: values.active,
    appliesToAllUnits: values.appliesToAllUnits,
    benefitHours,
    clientId: values.clientId.trim() ? Number(values.clientId) : null,
    clientName: values.clientName,
    fuelMinLiters,
    notes: values.notes,
    targetType: values.targetType,
    type: values.type,
    unitIds: values.appliesToAllUnits ? [] : parseStringList(values.unitIds),
    vehicleId: values.vehicleId.trim() ? Number(values.vehicleId) : null,
    vehiclePlate: values.vehiclePlate,
    yardOccupancyThreshold,
    yardStaleVehicleHours,
  })

  if (!result.success) {
    return { success: false as const, errors: getVipRuleFormErrors(result.error) }
  }

  const type = result.data.type
  const targetType = result.data.targetType
  const payload: SaveVipRulePayload = {
    id: result.data.id,
    type,
    targetType,
    clientId: result.data.clientId,
    clientName: result.data.clientName.trim() || null,
    vehicleId: result.data.vehicleId,
    vehiclePlate: result.data.vehiclePlate.trim() || null,
    vehicleIds: result.data.vehicleId ? [result.data.vehicleId] : [],
    appliesToAllUnits: result.data.appliesToAllUnits,
    unitIds: result.data.unitIds,
    active: result.data.active,
    fuelMinLiters: type === "fuel" ? result.data.fuelMinLiters : null,
    benefitHours: type === "vip" ? result.data.benefitHours : null,
    yardOccupancyThreshold: type === "yard_cleaning" ? result.data.yardOccupancyThreshold : null,
    yardStaleVehicleHours: type === "yard_cleaning" ? result.data.yardStaleVehicleHours : null,
    notes: result.data.notes.trim() || null,
  }

  return {
    success: true as const,
    data: payload,
    errors: {} as VipRuleFormErrors,
  }
}
