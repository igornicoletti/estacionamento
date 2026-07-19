import { unitsCopy } from "../constants"
import {
  normalizeUnitYardConfig,
  sanitizeParkingSpots,
} from "./units-normalization"
import { type Unit, type UnitUserStats, type UnitYardConfig } from "./units-types"

type UserWithUnitRole = {
  role: string
  unitId: string | null
}

export function formatUnitCityState(unit: Unit) {
  return [unit.nom_cidade, unit.sgl_estado].filter(Boolean).join("/") || unitsCopy.details.emptyValue
}

export function formatUnitSystemLabel(value: string) {
  return value.trim() ? unitsCopy.table.erpSystemLabel : unitsCopy.details.emptyValue
}

export function createUnitMapHref(coordinates: string) {
  const value = coordinates.trim()

  if (!value) {
    return null
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
}

export function parseUnitRouteId(value: string | undefined) {
  const unitId = Number(value)
  return Number.isFinite(unitId) && unitId > 0 ? Math.trunc(unitId) : null
}

export function resolveYardStatusLabel(value: boolean) {
  return value ? unitsCopy.yard.statusActive : unitsCopy.yard.statusInactive
}

export function parseYardSpotsInput(value: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return {
      isValid: false as const,
      error: unitsCopy.yard.validationInvalidSpots,
    }
  }

  return {
    isValid: true as const,
    value: sanitizeParkingSpots(parsed),
  }
}

export function resolveDefaultUnitYardConfig(unitId: string): UnitYardConfig {
  return {
    unitId,
    patioActive: false,
    parkingSpots: 0,
    updatedAt: new Date(0).toISOString(),
  }
}

export function buildUnitYardConfigMap(configs: readonly UnitYardConfig[]) {
  return new Map(configs.map((config) => [config.unitId, normalizeUnitYardConfig(config)]))
}

export function resolveUnitYardConfig(
  unitId: string,
  configs: ReadonlyMap<string, UnitYardConfig>
) {
  return configs.get(unitId) ?? resolveDefaultUnitYardConfig(unitId)
}

export function buildUnitUserStats(users: readonly UserWithUnitRole[]) {
  const stats = new Map<string, UnitUserStats>()

  for (const user of users) {
    if (!user.unitId) {
      continue
    }

    const current = stats.get(user.unitId) ?? { managers: 0, operators: 0 }

    if (user.role === "manager") {
      current.managers += 1
    }

    if (user.role === "operator") {
      current.operators += 1
    }

    stats.set(user.unitId, current)
  }

  return stats
}

export const buildActiveUnitUserStats = buildUnitUserStats

export function resolveUnitUsersSnapshot<TUser extends { unitId: string | null }>(
  users: readonly TUser[],
  unitId: string
) {
  return users.filter((user) => user.unitId === unitId)
}
