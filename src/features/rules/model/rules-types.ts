export const ruleTypeValues = ["vip", "fuel", "yard_cleaning"] as const
export type RuleType = (typeof ruleTypeValues)[number]

export const ruleTargetTypeValues = ["client", "vehicle", "unit", "global"] as const
export type RuleTargetType = (typeof ruleTargetTypeValues)[number]

export const ruleTypeLabels: Record<RuleType, string> = {
  vip: "VIP",
  fuel: "Abastecimento",
  yard_cleaning: "Limpeza de pátio",
}

export const ruleTargetTypeLabels: Record<RuleTargetType, string> = {
  client: "Cliente",
  vehicle: "Veículo",
  unit: "Unidade",
  global: "Global",
}

export interface VipRuleRecord {
  id: string
  type: RuleType
  targetType: RuleTargetType
  clientId: number | null
  clientName: string | null
  vehicleId: number | null
  vehiclePlate: string | null
  vehicleIds: number[]
  appliesToAllUnits: boolean
  unitIds: string[]
  active: boolean
  fuelMinLiters: number | null
  benefitHours: number | null
  yardOccupancyThreshold: number | null
  yardStaleVehicleHours: number | null
  notes: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface RawVipRuleRecord {
  id: unknown
  type: unknown
  target_type: unknown
  client_id: unknown
  client_name: unknown
  vehicle_id: unknown
  vehicle_plate: unknown
  vehicle_ids: unknown
  applies_to_all_units: unknown
  unit_ids: unknown
  active: unknown
  fuel_min_liters: unknown
  benefit_hours: unknown
  yard_occupancy_threshold: unknown
  yard_stale_vehicle_hours: unknown
  notes: unknown
  created_at: unknown
  updated_at: unknown
}

export interface VipRuleFormValues {
  id?: string
  type: RuleType | ""
  targetType: RuleTargetType | ""
  clientId: string
  clientName: string
  vehicleId: string
  vehiclePlate: string
  unitIds: string
  appliesToAllUnits: boolean
  active: boolean
  fuelMinLiters: string
  benefitHours: string
  yardOccupancyThreshold: string
  yardStaleVehicleHours: string
  notes: string
}

export interface SaveVipRulePayload {
  id?: string
  type: RuleType
  targetType: RuleTargetType
  clientId: number | null
  clientName: string | null
  vehicleId: number | null
  vehiclePlate: string | null
  vehicleIds: number[]
  appliesToAllUnits: boolean
  unitIds: string[]
  active: boolean
  fuelMinLiters: number | null
  benefitHours: number | null
  yardOccupancyThreshold: number | null
  yardStaleVehicleHours: number | null
  notes: string | null
}
