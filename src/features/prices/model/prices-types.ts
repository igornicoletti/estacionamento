export const priceScopeValues = ["global", "unit"] as const
export type PriceScope = (typeof priceScopeValues)[number]

export const priceStatusValues = ["active", "inactive", "draft", "archived"] as const
export type PriceStatus = (typeof priceStatusValues)[number]

export const priceScopeLabels: Record<PriceScope, string> = {
  global: "Global",
  unit: "Unidade",
}

export const priceStatusLabels: Record<PriceStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
  draft: "Rascunho",
  archived: "Arquivada",
}

export interface PriceTableRecord {
  id: string
  name: string
  scope: PriceScope
  unitId: string | null
  unitName: string | null
  graceMinutes: number
  toleranceMinutes: number
  cycleHours: number
  amount: number
  startsAt: string
  endsAt: string | null
  status: PriceStatus
  notes: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface RawPriceTableRecord {
  id: unknown
  name: unknown
  scope: unknown
  unit_id: unknown
  unit_name: unknown
  grace_minutes: unknown
  tolerance_minutes: unknown
  cycle_hours: unknown
  amount: unknown
  starts_at: unknown
  ends_at: unknown
  status: unknown
  notes: unknown
  created_at: unknown
  updated_at: unknown
}

export interface PriceTableFormValues {
  id?: string
  name: string
  scope: PriceScope | ""
  unitId: string
  unitName: string
  graceMinutes: string
  toleranceMinutes: string
  cycleHours: string
  amount: string
  startsAt: string
  endsAt: string
  status: PriceStatus | ""
  notes: string
}

export interface SavePriceTablePayload {
  id?: string
  name: string
  scope: PriceScope
  unitId: string | null
  unitName: string | null
  graceMinutes: number
  toleranceMinutes: number
  cycleHours: number
  amount: number
  startsAt: string
  endsAt: string | null
  status: PriceStatus
  notes: string | null
}
