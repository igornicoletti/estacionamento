import { formatDateTime } from "@/lib"
import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { rulesCopy } from "../rules-copy"
import { type VipRule, type VipRuleTargetType } from "../types/vip-rules-types"

export function getVipRuleTargetTypeLabel(targetType: VipRuleTargetType) {
  return targetType === "client" ? rulesCopy.labels.client : rulesCopy.labels.vehicle
}

export function getVipRuleStatusLabel(isActive: boolean) {
  return isActive ? rulesCopy.labels.active : rulesCopy.labels.inactive
}

export function createVipClientRuleId(clientId: number) {
  return `vip-client:${clientId}`
}

export function createVipVehicleRuleId(clientId: number, vehicleId: number) {
  return `vip-vehicle:${clientId}:${vehicleId}`
}

export function createVipRuleId(rule: Pick<VipRule, "targetType" | "clientId" | "vehicleId">) {
  return rule.targetType === "client"
    ? createVipClientRuleId(rule.clientId)
    : createVipVehicleRuleId(rule.clientId, rule.vehicleId ?? 0)
}

export function sortVipRulesByUpdatedAt(rules: readonly VipRule[]) {
  return [...rules].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
}

export function normalizeUnitIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function formatVipRuleUnitScope(rule: VipRule) {
  if (rule.appliesToAllUnits) {
    return rulesCopy.labels.allUnits
  }

  if (rule.unitIds.length > 0) {
    return `${rule.unitIds.length} unidade(s)`
  }

  return rulesCopy.labels.notConfigured
}

export function formatVipRuleVehicleScope(rule: VipRule) {
  if (rule.targetType === "vehicle") {
    return rule.vehiclePlate ?? rulesCopy.labels.specificVehicle
  }

  if (rule.appliesToAllVehicles) {
    return rulesCopy.labels.allVehicles
  }

  if (rule.vehicleIds.length > 0) {
    return `${rule.vehicleIds.length} veículo(s)`
  }

  return rulesCopy.labels.notConfigured
}

export const getVipRuleVehicleScopeLabel = formatVipRuleVehicleScope

export function buildVipRuleDetails(rule: VipRule): readonly AppDetailsSheetItem[] {
  return [
    { label: rulesCopy.table.type, value: getVipRuleTargetTypeLabel(rule.targetType) },
    { label: rulesCopy.table.clientId, value: rule.clientId },
    { label: rulesCopy.table.client, value: rule.clientName },
    { label: rulesCopy.table.vehicleId, value: rule.vehicleId ?? rulesCopy.labels.emptyValue },
    { label: rulesCopy.table.vehiclePlate, value: rule.vehiclePlate ?? rulesCopy.labels.allVehicles },
    { label: rulesCopy.table.vehicles, value: formatVipRuleVehicleScope(rule) },
    { label: rulesCopy.table.units, value: formatVipRuleUnitScope(rule) },
    { label: rulesCopy.table.status, value: getVipRuleStatusLabel(rule.active) },
    { label: rulesCopy.table.reason, value: rule.reason ?? rulesCopy.labels.emptyValue },
    { label: rulesCopy.table.notes, value: rule.notes ?? rulesCopy.labels.emptyValue },
    { label: rulesCopy.table.updatedAt, value: formatDateTime(rule.updatedAt) },
  ]
}

export function isClientVipFromRules(rules: readonly VipRule[], clientId: number) {
  return rules.some((rule) => rule.active && rule.targetType === "client" && rule.clientId === clientId)
}

export function isVehicleVipFromRules(
  rules: readonly VipRule[],
  clientId: number,
  vehicleId: number
) {
  return rules.some((rule) => {
    if (!rule.active || rule.clientId !== clientId) {
      return false
    }

    if (rule.targetType === "vehicle") {
      return rule.vehicleId === vehicleId
    }

    if (rule.appliesToAllVehicles) {
      return true
    }

    return rule.vehicleIds.includes(vehicleId)
  })
}
