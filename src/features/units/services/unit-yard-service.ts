import { getUnitYardGateway } from "../gateways/unit-yard-gateway"
import { mapUnitYardConfig } from "../model/units-normalization"
import { type UnitYardConfig } from "../model/units-types"

function normalizeUnitId(unitId: string) {
  const normalized = unitId.trim()

  if (!/^\d+$/.test(normalized)) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) && parsed > 0
    ? String(parsed)
    : null
}

export async function listUnitYardConfigs(): Promise<UnitYardConfig[]> {
  return (await getUnitYardGateway().listConfigs()).map(mapUnitYardConfig)
}

export async function getUnitYardConfig(unitId: string) {
  const normalizedUnitId = normalizeUnitId(unitId)

  if (!normalizedUnitId) {
    return null
  }

  const row = await getUnitYardGateway().findConfigByUnitId(
    normalizedUnitId
  )

  return row ? mapUnitYardConfig(row) : null
}
