import { rulesCopy } from "../constants"
import { ruleTargetTypeLabels, ruleTypeLabels, type VipRuleRecord } from "./rules-types"

export function formatRuleTarget(record: VipRuleRecord) {
  if (record.targetType === "client") {
    return record.clientName ?? (record.clientId ? String(record.clientId) : "—")
  }

  if (record.targetType === "vehicle") {
    return record.vehiclePlate ?? (record.vehicleId ? String(record.vehicleId) : "—")
  }

  return ruleTargetTypeLabels[record.targetType]
}

export function formatRuleUnits(record: VipRuleRecord) {
  return record.appliesToAllUnits
    ? rulesCopy.labels.allUnits
    : record.unitIds.length > 0
      ? record.unitIds.join(", ")
      : "—"
}

export function formatRuleBenefit(record: VipRuleRecord) {
  if (record.benefitHours !== null) {
    return `${record.benefitHours}h`
  }

  return "—"
}

export function formatRuleCondition(record: VipRuleRecord) {
  if (record.type === "fuel" && record.fuelMinLiters !== null) {
    return `Mínimo de ${record.fuelMinLiters}L`
  }

  if (record.type === "yard_cleaning" && record.yardOccupancyThreshold !== null) {
    return `Ocupação acima de ${record.yardOccupancyThreshold}%`
  }

  if (record.type === "vip") {
    return "Cliente VIP"
  }

  return ruleTypeLabels[record.type]
}

export function formatNullableDateTime(value: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}
