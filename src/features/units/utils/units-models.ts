import { type UserRecord } from "@/features/users"

import {
  type Unit,
  type UnitYardConfig,
} from "../types/units-types"
import { unitsCopy } from "../units-copy"

export interface UnitUserStats {
  managers: number
  operators: number
}

export function createUnitMapHref(coordinates: string) {
  const normalizedCoordinates = coordinates.trim()

  if (!normalizedCoordinates) {
    return null
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedCoordinates)}`
}

export function formatUnitSystemLabel(databaseName: string) {
  const normalized = databaseName.trim().toLowerCase()

  if (!normalized) {
    return "-"
  }

  if (normalized.startsWith("erp_montecarlo_")) {
    const region = normalized.replace("erp_montecarlo_", "")

    if (!region) {
      return unitsCopy.table.erpSystemLabel
    }

    return `${unitsCopy.table.erpSystemLabel} (${region.charAt(0).toUpperCase()}${region.slice(1)})`
  }

  return unitsCopy.table.erpSystemLabel
}

export function formatUnitCityState(unit: Unit) {
  return `${unit.nom_cidade}/${unit.sgl_estado.toUpperCase()}`
}

export function resolveYardStatusLabel(patioActive: boolean) {
  return patioActive ? unitsCopy.yard.statusActive : unitsCopy.yard.statusInactive
}

export function parseUnitRouteId(value: string | undefined) {
  const normalized = Number(value)

  return Number.isFinite(normalized) ? String(Math.trunc(normalized)) : ""
}

export function buildUnitYardConfigMap(configs: readonly UnitYardConfig[]) {
  return new Map(configs.map((item) => [item.unitId, item]))
}

export function resolveDefaultUnitYardConfig(unitId: string): UnitYardConfig {
  return {
    unitId,
    patioActive: false,
    parkingSpots: 0,
    updatedAt: new Date(0).toISOString(),
  }
}

export function sanitizeParkingSpots(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value))
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim())

    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
  }

  return 0
}

export function normalizeUnitYardConfig(value: unknown): UnitYardConfig | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<UnitYardConfig>
  const unitId = typeof candidate.unitId === "string" ? candidate.unitId.trim() : ""

  if (!unitId) {
    return null
  }

  const updatedAtRaw =
    typeof candidate.updatedAt === "string" && candidate.updatedAt
      ? candidate.updatedAt
      : new Date(0).toISOString()

  return {
    unitId,
    patioActive: Boolean(candidate.patioActive),
    parkingSpots: sanitizeParkingSpots(candidate.parkingSpots),
    updatedAt: updatedAtRaw,
  }
}

export function resolveUnitYardConfig(
  unitId: string,
  configMap: ReadonlyMap<string, UnitYardConfig>
) {
  return configMap.get(unitId) ?? resolveDefaultUnitYardConfig(unitId)
}

export function buildActiveUnitUserStats(users: readonly UserRecord[]) {
  const nextStats = new Map<string, UnitUserStats>()

  users
    .filter((user) => user.status === "active")
    .forEach((user) => {
      if (!user.unitId) {
        return
      }

      if (user.role !== "manager" && user.role !== "operator") {
        return
      }

      const current = nextStats.get(user.unitId) ?? { managers: 0, operators: 0 }

      if (user.role === "manager") {
        current.managers += 1
      } else {
        current.operators += 1
      }

      nextStats.set(user.unitId, current)
    })

  return nextStats
}

export function resolveUnitUsersSnapshot(
  unitId: string,
  units: readonly Unit[],
  users: readonly UserRecord[]
) {
  const unit = units.find((currentUnit) => String(currentUnit.cod_empresa) === unitId) ?? null
  const data = users.filter((user) => {
    if (!user.unitId) {
      return false
    }

    const hasValidRole = user.role === "manager" || user.role === "operator"
    return hasValidRole && user.unitId === unitId
  })

  return { data, unit }
}

export function parseYardSpotsInput(value: string) {
  const parsedSpots = Number(value)

  if (!Number.isFinite(parsedSpots) || parsedSpots < 0) {
    return {
      isValid: false,
      value: 0,
      error: unitsCopy.yard.validationInvalidSpots,
    }
  }

  return {
    isValid: true,
    value: Math.trunc(parsedSpots),
    error: null,
  }
}
