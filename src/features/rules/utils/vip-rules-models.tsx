import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { formatDateTime } from "@/lib"

import { rulesCopy } from "../rules-copy"
import {
  type CommercialRuleType,
  type VipRule,
  type VipRuleTargetType,
} from "../types/vip-rules-types"

export function getCommercialRuleTypeLabel(type: CommercialRuleType) {
  const labels: Record<CommercialRuleType, string> = {
    fuel_benefit: rulesCopy.labels.fuelBenefit,
    vip: rulesCopy.labels.vip,
    yard_cleaning: rulesCopy.labels.yardCleaning,
    yard_cleaning_occupancy: rulesCopy.labels.yardCleaningOccupancy,
    yard_cleaning_stale_vehicle: rulesCopy.labels.yardCleaningStaleVehicle,
  }

  return labels[type]
}

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

export function createVipRuleId(
  rule: Pick<VipRule, "clientId" | "id" | "ruleType" | "targetType" | "vehicleId">
) {
  if (rule.id) {
    return rule.id
  }

  if (rule.ruleType !== "vip" || !rule.clientId) {
    return rule.id
  }

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

export function formatRuleUnitScope(rule: Pick<VipRule, "appliesToAllUnits" | "unitIds">) {
  if (rule.appliesToAllUnits) {
    return rulesCopy.labels.allUnits
  }

  if (rule.unitIds.length > 0) {
    return `${rule.unitIds.length} unidade(s)`
  }

  return rulesCopy.labels.notConfigured
}

export const formatVipRuleUnitScope = formatRuleUnitScope

export function formatVipRuleVehicleScope(rule: VipRule) {
  if (rule.ruleType !== "vip") {
    return rulesCopy.labels.emptyValue
  }

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

export function buildCommercialRuleSummary(rule: VipRule) {
  if (rule.ruleType === "vip") {
    if (rule.targetType === "vehicle") {
      return `${rule.vehiclePlate ?? rulesCopy.labels.specificVehicle} - ${rule.clientName ?? rulesCopy.labels.emptyValue}`
    }

    return rule.clientName ?? rulesCopy.labels.emptyValue
  }

  if (rule.ruleType === "fuel_benefit") {
    return `${rule.fuelMinLiters ?? 0}L mínimos concedem ${rule.benefitHours ?? 0}H`
  }

  if (rule.ruleType === "yard_cleaning_occupancy") {
    return `Alerta a partir de ${rule.yardOccupancyThreshold ?? 0} vagas preenchidas`
  }

  if (rule.ruleType === "yard_cleaning_stale_vehicle") {
    return `Alerta após ${rule.yardStaleVehicleHours ?? 0}H sem saída`
  }

  return `Alerta com ${rule.yardOccupancyThreshold ?? 0} vagas ou ${rule.yardStaleVehicleHours ?? 0}H sem saída`
}

export function buildVipRuleDetails(rule: VipRule): readonly AppDetailsSheetItem[] {
  const items: AppDetailsSheetItem[] = [
    { label: rulesCopy.table.type, value: getCommercialRuleTypeLabel(rule.ruleType) },
    { label: rulesCopy.table.summary, value: rule.ruleSummary },
    { label: rulesCopy.table.scope, value: rule.scopeLabel },
    { label: rulesCopy.table.status, value: getVipRuleStatusLabel(rule.active) },
  ]

  if (rule.ruleType === "vip") {
    items.push(
      { label: rulesCopy.table.clientId, value: rule.clientId ?? rulesCopy.labels.emptyValue },
      { label: rulesCopy.table.client, value: rule.clientName ?? rulesCopy.labels.emptyValue },
      { label: rulesCopy.table.vehicleId, value: rule.vehicleId ?? rulesCopy.labels.emptyValue },
      { label: rulesCopy.table.vehiclePlate, value: rule.vehiclePlate ?? rulesCopy.labels.allVehicles },
      { label: rulesCopy.table.vehicles, value: formatVipRuleVehicleScope(rule) }
    )
  }

  if (rule.ruleType === "fuel_benefit") {
    items.push(
      { label: rulesCopy.table.fuelMinLiters, value: rule.fuelMinLiters ?? rulesCopy.labels.emptyValue },
      { label: rulesCopy.table.benefitHours, value: rule.benefitHours ?? rulesCopy.labels.emptyValue }
    )
  }

  if (rule.ruleType === "yard_cleaning_occupancy" || rule.ruleType === "yard_cleaning") {
    items.push({
      label: rulesCopy.table.yardOccupancyThreshold,
      value: rule.yardOccupancyThreshold ?? rulesCopy.labels.emptyValue,
    })
  }

  if (rule.ruleType === "yard_cleaning_stale_vehicle" || rule.ruleType === "yard_cleaning") {
    items.push({
      label: rulesCopy.table.yardStaleVehicleHours,
      value: rule.yardStaleVehicleHours
        ? `${rule.yardStaleVehicleHours} h`
        : rulesCopy.labels.emptyValue,
    })
  }

  items.push(
    { label: rulesCopy.table.reason, value: rule.reason ?? rulesCopy.labels.emptyValue },
    { label: rulesCopy.table.updatedAt, value: formatDateTime(rule.updatedAt) }
  )

  return items
}

export function isClientVipFromRules(rules: readonly VipRule[], clientId: number) {
  return rules.some((rule) => rule.active && rule.ruleType === "vip" && rule.targetType === "client" && rule.clientId === clientId)
}

export function isVehicleVipFromRules(
  rules: readonly VipRule[],
  clientId: number,
  vehicleId: number
) {
  return rules.some((rule) => {
    if (!rule.active || rule.ruleType !== "vip" || rule.clientId !== clientId) {
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
