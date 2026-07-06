import {
  appendAuditEvent,
} from "@/features/audit"

import { toError } from "@/lib"

import {
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "../types/units-types"
import { unitsCopy } from "../units-copy"
import {
  normalizeUnitYardConfig,
  resolveDefaultUnitYardConfig,
  sanitizeParkingSpots,
} from "../utils/units-models"
import { getUnitYardGateway } from "./unit-yard-gateway"

async function listSanitizedConfigs() {
  const rawConfigs = await getUnitYardGateway().list()

  return rawConfigs
    .map(normalizeUnitYardConfig)
    .filter((config): config is UnitYardConfig => Boolean(config))
}

export async function listUnitYardConfigs(): Promise<UnitYardConfig[]> {
  return listSanitizedConfigs()
}

export async function getUnitYardConfig(unitId: string): Promise<UnitYardConfig> {
  const normalizedUnitId = unitId.trim()

  if (!normalizedUnitId) {
    return resolveDefaultUnitYardConfig("")
  }

  const current = (await listSanitizedConfigs()).find(
    (config) => config.unitId === normalizedUnitId
  )

  return current ?? resolveDefaultUnitYardConfig(normalizedUnitId)
}

export async function upsertUnitYardConfig(
  input: UpsertUnitYardConfigInput
): Promise<UnitYardConfig> {
  await Promise.resolve()

  const normalizedUnitId = input.unitId.trim()

  if (!normalizedUnitId) {
    throw new Error(unitsCopy.errors.unitYardInvalidUnit)
  }

  const nextConfig: UnitYardConfig = {
    unitId: normalizedUnitId,
    patioActive: input.patioActive,
    parkingSpots: sanitizeParkingSpots(input.parkingSpots),
    updatedAt: new Date().toISOString(),
  }

  const current = (await listSanitizedConfigs()).filter(
    (config) => config.unitId !== normalizedUnitId
  )

  try {
    await getUnitYardGateway().saveAll([nextConfig, ...current])
  } catch (caughtError) {
    throw toError(caughtError, unitsCopy.errors.unitYardSave)
  }

  try {
    await appendAuditEvent({
      action: "unit.yard_updated",
      description: `Pátio da unidade ${input.unitName ?? normalizedUnitId} ${input.patioActive ? "ativado" : "desativado"
        } com ${nextConfig.parkingSpots} vagas configuradas.`,
      entity: "Pátio da unidade",
      entityId: normalizedUnitId,
      unitName: input.unitName ?? null,
      outcome: "success",
    })
  } catch {
    // Audit persistence failure must not block the main operation.
  }

  return nextConfig
}
