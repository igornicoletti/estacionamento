export const commercialRuleTypeValues = [
  "vip",
  "fuel_benefit",
  "yard_cleaning_occupancy",
  "yard_cleaning_stale_vehicle",
] as const

export type CommercialRuleType = (typeof commercialRuleTypeValues)[number]

export const commercialRuleTargetTypeValues = [
  "client",
  "network",
  "unit",
  "vehicle",
] as const

export type CommercialRuleTargetType =
  (typeof commercialRuleTargetTypeValues)[number]

export const vipRuleTargetTypeValues = ["client", "vehicle"] as const

export type VipRuleTargetType = (typeof vipRuleTargetTypeValues)[number]

export type RuleUnitScope = "network" | "unit"

export interface VipRule {
  id: string
  ruleType: CommercialRuleType
  targetType: CommercialRuleTargetType
  clientId: number | null
  clientName: string | null
  vehicleId: number | null
  vehiclePlate: string | null
  appliesToAllVehicles: boolean
  vehicleIds: number[]
  appliesToAllUnits: boolean
  unitIds: string[]
  active: boolean
  fuelMinLiters: number | null
  benefitHours: number | null
  yardOccupancyThreshold: number | null
  yardStaleVehicleHours: number | null
  reason: string | null
  notes: string | null
  ruleSummary: string
  scopeLabel: string
  updatedAt: string
}

export type SaveVipRuleInput =
  | {
      ruleType: "vip"
      targetType: VipRuleTargetType
      clientId: number
      clientName: string
      vehicleId: number | null
      vehiclePlate: string | null
      appliesToAllUnits: boolean
      unitIds: string[]
      active: boolean
      reason: string
      notes: string | null
    }
  | {
      ruleType: "fuel_benefit"
      scope: RuleUnitScope
      unitIds: string[]
      fuelMinLiters: number
      benefitHours: number
      active: boolean
      reason: string
      notes: string | null
    }
  | {
      ruleType: "yard_cleaning_occupancy"
      unitIds: string[]
      yardOccupancyThreshold: number
      active: boolean
      reason: string
      notes: string | null
    }
  | {
      ruleType: "yard_cleaning_stale_vehicle"
      scope: RuleUnitScope
      unitIds: string[]
      yardStaleVehicleHours: number
      active: boolean
      reason: string
      notes: string | null
    }

export interface ToggleClientVipInput {
  clientId: number
  clientName: string
  enabled: boolean
}

export interface ToggleVehicleVipInput {
  clientId: number
  clientName: string
  vehicleId: number
  vehiclePlate: string
  enabled: boolean
}
