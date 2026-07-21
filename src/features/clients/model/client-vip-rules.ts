import { readNullableString, readNumber, readString } from "./clients-parsers"

export type ClientVipRuleTargetType = "client" | "vehicle"

export interface RawClientVipRuleRecord {
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
  status: unknown
  ends_at: unknown
  updated_at: unknown
}

export interface ClientVipRuleRecord {
  id: string
  targetType: ClientVipRuleTargetType
  clientId: number | null
  clientName: string | null
  vehicleId: number | null
  vehiclePlate: string | null
  vehicleIds: readonly number[]
  appliesToAllUnits: boolean
  unitIds: readonly string[]
  active: boolean
  updatedAt: string | null
}

function isClientVipRuleTargetType(value: unknown): value is ClientVipRuleTargetType {
  return value === "client" || value === "vehicle"
}

function normalizeNumberArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const parsedValue = readNumber(item)
    return parsedValue > 0 ? [parsedValue] : []
  })
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const parsedValue = readString(item)
    return parsedValue ? [parsedValue] : []
  })
}

function normalizeNullableId(value: unknown) {
  const parsedValue = readNumber(value)
  return parsedValue > 0 ? parsedValue : null
}

function normalizeUpdatedAt(value: unknown) {
  const text = readNullableString(value)

  if (!text) {
    return null
  }

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeActiveStatus(status: unknown, endsAt: unknown) {
  return readString(status).toLocaleLowerCase("pt-BR") === "active" && !readNullableString(endsAt)
}

export function normalizeClientVipRuleRecord(row: RawClientVipRuleRecord): ClientVipRuleRecord | null {
  if (row.type !== "vip" || !isClientVipRuleTargetType(row.target_type)) {
    return null
  }

  const id = readString(row.id)

  if (!id) {
    return null
  }

  return {
    id,
    targetType: row.target_type,
    clientId: normalizeNullableId(row.client_id),
    clientName: readNullableString(row.client_name),
    vehicleId: normalizeNullableId(row.vehicle_id),
    vehiclePlate: readNullableString(row.vehicle_plate),
    vehicleIds: normalizeNumberArray(row.vehicle_ids),
    appliesToAllUnits: row.applies_to_all_units === true,
    unitIds: normalizeStringArray(row.unit_ids),
    active: normalizeActiveStatus(row.status, row.ends_at),
    updatedAt: normalizeUpdatedAt(row.updated_at),
  }
}

export function normalizeClientVipRuleRecords(rows: readonly RawClientVipRuleRecord[]) {
  return rows
    .map(normalizeClientVipRuleRecord)
    .filter((rule): rule is ClientVipRuleRecord => Boolean(rule))
    .sort((first, second) => (second.updatedAt ?? "").localeCompare(first.updatedAt ?? ""))
}

export function getClientVipStatus(client: { cod_pessoa: number }, rules: readonly ClientVipRuleRecord[]) {
  return rules.some((rule) => {
    return rule.active && rule.clientId === client.cod_pessoa
  })
}

export function getVehicleVipStatus(
  vehicle: { cod_pessoa: number; cod_veiculo: number },
  rules: readonly ClientVipRuleRecord[]
) {
  return rules.some((rule) => {
    if (!rule.active || rule.clientId !== vehicle.cod_pessoa) {
      return false
    }

    if (rule.targetType === "vehicle") {
      return rule.vehicleId === vehicle.cod_veiculo || rule.vehicleIds.includes(vehicle.cod_veiculo)
    }

    return rule.targetType === "client"
  })
}
