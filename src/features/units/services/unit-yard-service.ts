import {
  normalizeUnitYardConfig,
  normalizeUnitYardConfigs,
  validateUpsertUnitYardConfigInput,
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "../model"
import { getUnitYardGateway } from "./unit-yard-gateway"

function normalizeUnitId(unitId: string) {
  return unitId.trim()
}

export async function listUnitYardConfigs(): Promise<UnitYardConfig[]> {
  const configs = await getUnitYardGateway().listConfigs()
  return normalizeUnitYardConfigs(configs)
}

export async function getUnitYardConfig(unitId: string) {
  const normalizedUnitId = normalizeUnitId(unitId)
  if (!normalizedUnitId) {
    return null
  }
  const configs = await listUnitYardConfigs()
  return configs.find((config) => config.unitId === normalizedUnitId) ?? null
}

export async function upsertUnitYardConfig(input: UpsertUnitYardConfigInput) {
  const payload = validateUpsertUnitYardConfigInput(input)
  const config = await getUnitYardGateway().upsertConfig(payload)
  return normalizeUnitYardConfig(config)
}
