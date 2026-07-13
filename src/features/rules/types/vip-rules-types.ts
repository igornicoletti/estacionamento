export const vipRuleTargetTypeValues = ["client", "vehicle"] as const

export type VipRuleTargetType = (typeof vipRuleTargetTypeValues)[number]

export interface VipRule {
  id: string
  targetType: VipRuleTargetType
  clientId: number
  clientName: string
  vehicleId: number | null
  vehiclePlate: string | null
  appliesToAllVehicles: boolean
  vehicleIds: number[]
  appliesToAllUnits: boolean
  unitIds: string[]
  active: boolean
  reason: string | null
  notes: string | null
  updatedAt: string
}

export interface SaveVipRuleInput {
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
