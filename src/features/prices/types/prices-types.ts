export const priceTableScopeValues = ["network", "unit"] as const
export const priceRecordStatusValues = ["active", "inactive"] as const

export type PriceTableScope = (typeof priceTableScopeValues)[number]
export type PriceRecordStatus = (typeof priceRecordStatusValues)[number]
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
  notes: string | null
  updatedAt: string
  tiers: PriceTier[]
}

export interface SavePriceTableInput {
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
  notes: string | null
}
