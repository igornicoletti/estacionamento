import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { rulesCopy } from "../constants"
import { type SaveVipRulePayload, type VipRuleRecord } from "../model"
import {
  listVipRules,
  saveVipRule,
  type VipRulesResult,
} from "../services/vip-rules-service"

export type VipRule = VipRuleRecord

const initialVipRulesResult: VipRulesResult = {
  records: [],
  isTruncated: false,
  limit: 500,
}

async function loadVipRulesResult(): Promise<VipRulesResult> {
  const result = await listVipRules()

  if (Array.isArray(result)) {
    return {
      records: result,
      isTruncated: false,
      limit: result.length,
    }
  }

  return result
}

export function useVipRules() {
  const { data, error, isLoading, refetch } = useAsyncSnapshot<VipRulesResult>({
    cacheKey: "rules:list",
    initialData: initialVipRulesResult,
    loadData: loadVipRulesResult,
    errorMessage: rulesCopy.feedback.loadError,
  })

  return {
    data: data.records,
    error,
    isLoading,
    isTruncated: data.isTruncated,
    limit: data.limit,
    refetch,
    toggleClientVip: async (input: {
      clientId: number
      clientName: string
      enabled: boolean
    }) => {
      return saveVipRule({
        type: "vip",
        targetType: "client",
        clientId: input.clientId,
        clientName: input.clientName,
        vehicleId: null,
        vehiclePlate: null,
        vehicleIds: [],
        appliesToAllUnits: true,
        unitIds: [],
        active: input.enabled,
        fuelMinLiters: null,
        benefitHours: null,
        yardOccupancyThreshold: null,
        yardStaleVehicleHours: null,
        notes: null,
      } satisfies SaveVipRulePayload)
    },
    toggleVehicleVip: async (input: {
      clientId: number
      clientName: string
      vehicleId: number
      vehiclePlate: string
      enabled: boolean
    }) => {
      return saveVipRule({
        type: "vip",
        targetType: "vehicle",
        clientId: input.clientId,
        clientName: input.clientName,
        vehicleId: input.vehicleId,
        vehiclePlate: input.vehiclePlate,
        vehicleIds: [input.vehicleId],
        appliesToAllUnits: true,
        unitIds: [],
        active: input.enabled,
        fuelMinLiters: null,
        benefitHours: null,
        yardOccupancyThreshold: null,
        yardStaleVehicleHours: null,
        notes: null,
      } satisfies SaveVipRulePayload)
    },
  }
}

export function getClientVipStatus(
  client: { cod_pessoa: number },
  rules: readonly VipRuleRecord[]
) {
  return isClientVipFromRules(rules, client.cod_pessoa)
}

export function getVehicleVipStatus(
  vehicle: { cod_pessoa: number; cod_veiculo: number },
  rules: readonly VipRuleRecord[]
) {
  return isVehicleVipFromRules(rules, vehicle.cod_pessoa, vehicle.cod_veiculo)
}

export function isClientVipFromRules(
  rules: readonly VipRule[],
  clientId: number
) {
  return rules.some((rule) => {
    return (
      rule.active &&
      rule.type === "vip" &&
      (rule.clientId === clientId ||
        (rule.targetType === "vehicle" && rule.clientId === clientId))
    )
  })
}

export function isVehicleVipFromRules(
  rules: readonly VipRule[],
  clientId: number,
  vehicleId: number
) {
  return rules.some((rule) => {
    if (!rule.active || rule.type !== "vip") {
      return false
    }

    if (rule.targetType === "vehicle") {
      return rule.clientId === clientId && rule.vehicleId === vehicleId
    }

    return rule.targetType === "client" && rule.clientId === clientId
  })
}

export function formatVipRuleUnitScope(rule: VipRule) {
  if (rule.appliesToAllUnits) {
    return "Todas as unidades"
  }

  return rule.unitIds.length > 0 ? rule.unitIds.join(", ") : "—"
}

export function getVipRuleVehicleScopeLabel(rule: VipRule) {
  if (rule.targetType === "vehicle") {
    return rule.vehiclePlate ?? (rule.vehicleId ? String(rule.vehicleId) : "—")
  }

  return "Todos os veículos"
}
