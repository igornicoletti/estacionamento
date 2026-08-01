import { unitsCopy } from "../constants/units-copy"
import {
  type Unit,
  type UnitYardConfig,
} from "./units-types"

const positiveIntegerRouteParamPattern = /^\d+$/

export function formatUnitCityState(
  unit: Pick<Unit, "nom_cidade" | "sgl_estado">
) {
  return (
    [unit.nom_cidade, unit.sgl_estado].filter(Boolean).join("/") ||
    unitsCopy.details.emptyValue
  )
}

export function formatUnitSystemLabel(value: string) {
  return value.trim()
    ? unitsCopy.table.erpSystemLabel
    : unitsCopy.details.emptyValue
}

export function createUnitMapHref(coordinates: string) {
  const value = coordinates.trim()

  return value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
    : null
}

export function parseUnitRouteId(value: string | undefined) {
  const normalizedValue = value?.trim() ?? ""

  if (!positiveIntegerRouteParamPattern.test(normalizedValue)) {
    return null
  }

  const unitId = Number(normalizedValue)
  return Number.isSafeInteger(unitId) && unitId > 0 ? unitId : null
}

export function resolveYardStatusLabel(value: boolean | null) {
  if (value === null) {
    return unitsCopy.yard.statusNotConfigured
  }

  return value
    ? unitsCopy.yard.statusActive
    : unitsCopy.yard.statusInactive
}

export function buildUnitYardConfigMap(
  configs: readonly UnitYardConfig[]
) {
  return new Map(configs.map((config) => [config.unitId, config]))
}

export function resolveUnitUsersSnapshot<
  TUser extends { unitId: string | null },
>(users: readonly TUser[], unitId: string) {
  return users.filter((user) => user.unitId === unitId)
}
