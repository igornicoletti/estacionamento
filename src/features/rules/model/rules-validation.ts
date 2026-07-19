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

function parseNumberList(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item))
}

function parseStringList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
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
  const errors: VipRuleFormErrors = {}
  const fuelMinLiters = parseNumber(values.fuelMinLiters)
  const benefitHours = parseNumber(values.benefitHours)
  const yardOccupancyThreshold = parseNumber(values.yardOccupancyThreshold)
  const yardStaleVehicleHours = parseNumber(values.yardStaleVehicleHours)

  if (!isRuleType(values.type)) {
    errors.type = rulesCopy.validation.required
  }

  if (!isRuleTargetType(values.targetType)) {
    errors.targetType = rulesCopy.validation.required
  }

  if (values.targetType === "client" && !values.clientId.trim()) {
    errors.clientId = rulesCopy.validation.invalidClientId
  }

  if (values.targetType === "vehicle" && !values.vehicleId.trim()) {
    errors.vehicleId = rulesCopy.validation.required
  }

  if (!values.appliesToAllUnits && !values.unitIds.trim()) {
    errors.unitIds = rulesCopy.validation.required
  }

  if (values.type === "fuel" && (fuelMinLiters === null || fuelMinLiters <= 0)) {
    errors.fuelMinLiters = rulesCopy.validation.positiveNumber
  }

  if (values.type === "vip" && (benefitHours === null || benefitHours <= 0)) {
    errors.benefitHours = rulesCopy.validation.positiveNumber
  }

  if (
    values.type === "yard_cleaning" &&
    (yardOccupancyThreshold === null || yardOccupancyThreshold < 1 || yardOccupancyThreshold > 100)
  ) {
    errors.yardOccupancyThreshold = rulesCopy.validation.percentage
  }

  if (
    values.type === "yard_cleaning" &&
    (yardStaleVehicleHours === null || yardStaleVehicleHours <= 0)
  ) {
    errors.yardStaleVehicleHours = rulesCopy.validation.positiveNumber
  }

  if (Object.keys(errors).length > 0 || !isRuleType(values.type) || !isRuleTargetType(values.targetType)) {
    return { success: false as const, errors }
  }

  const payload: SaveVipRulePayload = {
    id: values.id,
    type: values.type,
    targetType: values.targetType,
    clientId: values.clientId.trim() ? Number(values.clientId) : null,
    clientName: values.clientName.trim() || null,
    vehicleId: values.vehicleId.trim() ? Number(values.vehicleId) : null,
    vehiclePlate: values.vehiclePlate.trim() || null,
    vehicleIds: parseNumberList(values.vehicleId),
    appliesToAllUnits: values.appliesToAllUnits,
    unitIds: values.appliesToAllUnits ? [] : parseStringList(values.unitIds),
    active: values.active,
    fuelMinLiters: values.type === "fuel" ? fuelMinLiters : null,
    benefitHours: values.type === "vip" ? benefitHours : null,
    yardOccupancyThreshold: values.type === "yard_cleaning" ? yardOccupancyThreshold : null,
    yardStaleVehicleHours: values.type === "yard_cleaning" ? yardStaleVehicleHours : null,
    notes: values.notes.trim() || null,
  }

  return {
    success: true as const,
    data: payload,
    errors: {} as VipRuleFormErrors,
  }
}
