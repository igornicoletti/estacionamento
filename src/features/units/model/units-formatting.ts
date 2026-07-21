import { unitsCopy } from "../constants/units-copy"
import { normalizeUnitYardConfig, sanitizeParkingSpots } from "./units-normalization"
import { type Unit, type UnitUserStats, type UnitYardConfig } from "./units-types"

type UserWithUnitRole = {
  role: string
  unitId: string | null
}

const positiveIntegerRouteParamPattern = /^\d+$/
const epochIsoDate = new Date(0).toISOString()

export function formatUnitCityState(unit: Unit) {
  return [unit.nom_cidade, unit.sgl_estado].filter(Boolean).join("/") || unitsCopy.details.emptyValue
}

export function formatUnitSystemLabel(value: string) {
  return value.trim() ? unitsCopy.table.erpSystemLabel : unitsCopy.details.emptyValue
}

export function formatUnitDateTime(value: string | null, fallback = unitsCopy.details.emptyValue) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date)
}

export function formatUnitDuration(value: number | null, fallback = unitsCopy.details.emptyValue) {
  if (value === null || !Number.isFinite(value)) {
    return fallback
  }

  if (value < 60) {
    return `${Math.max(0, Math.trunc(value))}s`
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.trunc(value % 60)
  return `${minutes}min ${seconds}s`
}

export function createUnitMapHref(coordinates: string) {
  const value = coordinates.trim()
  return value ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}` : null
}

export function parseUnitRouteId(value: string | undefined) {
  const normalizedValue = value?.trim() ?? ""
  if (!positiveIntegerRouteParamPattern.test(normalizedValue)) {
    return null
  }
  const unitId = Number(normalizedValue)
  return Number.isSafeInteger(unitId) && unitId > 0 ? unitId : null
}

export function resolveYardStatusLabel(value: boolean) {
  return value ? unitsCopy.yard.statusActive : unitsCopy.yard.statusInactive
}

export function parseYardSpotsInput(value: string) {
  const normalizedValue = value.trim()
  const parsed = Number(normalizedValue)
  if (!normalizedValue || !Number.isSafeInteger(parsed) || parsed < 0) {
    return { isValid: false as const, error: unitsCopy.yard.validationInvalidSpots }
  }
  return { isValid: true as const, value: sanitizeParkingSpots(parsed) }
}

export function resolveDefaultUnitYardConfig(unitId: string): UnitYardConfig {
  return { unitId, patioActive: false, parkingSpots: 0, updatedAt: epochIsoDate }
}

export function buildUnitYardConfigMap(configs: readonly UnitYardConfig[]) {
  return new Map(configs.map((config) => [config.unitId, normalizeUnitYardConfig(config)]))
}

export function resolveUnitYardConfig(unitId: string, configs: ReadonlyMap<string, UnitYardConfig>) {
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

export function resolveUnitUsersSnapshot<TUser extends { unitId: string | null }>(users: readonly TUser[], unitId: string) {
  return users.filter((user) => user.unitId === unitId)
}
