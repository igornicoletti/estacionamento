export type PriceTableScope = "network" | "unit"
export type PriceRecordStatus = "active" | "inactive"
export type PriceComputedStatus = PriceRecordStatus | "scheduled" | "expired"

export interface PriceTier {
  id: string
  sequence: number
  limitHours: number
  amount: number
  notes: string | null
}

export interface PriceTable {
  id: string
  scope: PriceTableScope
  unitId: string | null
  unitName: string | null
  graceMinutes: number
  toleranceMinutes: number
  cycleHours: number
  amount: number
  startsAt: string
  endsAt: string | null
  status: PriceRecordStatus
  computedStatus: PriceComputedStatus
  version: number
  parentId: string | null
  reason: string | null
  notes: string | null
  updatedAt: string
  tiers: PriceTier[]
}
