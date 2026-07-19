import { type SaveVipRulePayload } from "../model"
import {
  listVipRules as listVipRulesCurrent,
  saveVipRule as saveVipRuleCurrent,
  type VipRulesResult,
} from "./rules-service"

export type { VipRulesResult }

export type SaveVipRuleInput = SaveVipRulePayload

export async function listVipRules(): Promise<VipRulesResult> {
  return listVipRulesCurrent()
}

export async function saveVipRule(payload: SaveVipRuleInput): Promise<void> {
  await saveVipRuleCurrent(payload)
}

export async function toggleClientVip(input: {
  clientId: number
  clientName: string
  enabled: boolean
}): Promise<void> {
  await saveVipRuleCurrent({
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
  })
}

export async function toggleVehicleVip(input: {
  clientId: number
  clientName: string
  vehicleId: number
  vehiclePlate: string
  enabled: boolean
}): Promise<void> {
  await saveVipRuleCurrent({
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
  })
}
