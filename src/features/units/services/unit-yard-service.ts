import { unitsCopy } from "../units-copy"
import { type UnitYardConfig, type UpsertUnitYardConfigInput } from "../types/units-types"
import { sanitizeParkingSpots } from "../utils/units-models"
import { getUnitYardGateway } from "./unit-yard-gateway"

export async function listUnitYardConfigs(): Promise<UnitYardConfig[]> {
  return [...await getUnitYardGateway().listConfigs()]
}

export async function getUnitYardConfig(unitId: string) {
  const configs = await listUnitYardConfigs()
  return configs.find((config) => config.unitId === unitId) ?? null
}

export async function upsertUnitYardConfig(input: UpsertUnitYardConfigInput) {
  if (!input.unitId.trim()) {
    throw new Error(unitsCopy.errors.unitYardInvalidUnit)
  }

  return getUnitYardGateway().upsertConfig({
    ...input,
    parkingSpots: sanitizeParkingSpots(input.parkingSpots),
  })
}
