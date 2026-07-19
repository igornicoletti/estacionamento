import {
  normalizeUnitYardConfigs,
  validateUpsertUnitYardConfigInput,
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "../model"
import { getUnitYardGateway } from "./unit-yard-gateway"

export async function listUnitYardConfigs(): Promise<UnitYardConfig[]> {
  const configs = await getUnitYardGateway().listConfigs()
  return normalizeUnitYardConfigs(configs)
}

export async function getUnitYardConfig(unitId: string) {
  const configs = await listUnitYardConfigs()
  return configs.find((config) => config.unitId === unitId) ?? null
}

export async function upsertUnitYardConfig(input: UpsertUnitYardConfigInput) {
  const payload = validateUpsertUnitYardConfigInput(input)
  return getUnitYardGateway().upsertConfig(payload)
}
