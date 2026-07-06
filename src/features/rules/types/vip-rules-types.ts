export type VipRuleTargetType = "client" | "vehicle"

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
  updatedAt: string
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
