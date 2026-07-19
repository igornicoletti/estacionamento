import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { UNIT_YARD_MOCK_STORAGE_KEY, unitsCopy } from "../constants"
import {
  normalizeUnitYardConfig,
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "../model"

type RawUnitYardConfigRow = {
  unit_id: string
  patio_active: boolean
  parking_spots: number
  updated_at: string
}

export interface UnitYardGateway {
  listConfigs: () => Promise<readonly UnitYardConfig[]>
  upsertConfig: (input: UpsertUnitYardConfigInput) => Promise<UnitYardConfig>
}

const mockYardConfigMemoryStore = new Map<string, UnitYardConfig>()

function mapUnitYardConfig(row: RawUnitYardConfigRow): UnitYardConfig {
  return normalizeUnitYardConfig({
    unitId: row.unit_id,
    patioActive: row.patio_active,
    parkingSpots: row.parking_spots,
    updatedAt: row.updated_at,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readStoredMockConfigs(): UnitYardConfig[] {
  if (typeof window === "undefined") {
    return Array.from(mockYardConfigMemoryStore.values()).map(normalizeUnitYardConfig)
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(UNIT_YARD_MOCK_STORAGE_KEY) ?? "[]")

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.reduce<UnitYardConfig[]>((configs, item) => {
      if (
        isRecord(item) &&
        typeof item.unitId === "string" &&
        typeof item.patioActive === "boolean" &&
        typeof item.parkingSpots === "number" &&
        typeof item.updatedAt === "string"
      ) {
        configs.push(normalizeUnitYardConfig({
          unitId: item.unitId,
          patioActive: item.patioActive,
          parkingSpots: item.parkingSpots,
          updatedAt: item.updatedAt,
        }))
      }

      return configs
    }, [])
  } catch {
    return []
  }
}

function writeStoredMockConfigs(configs: readonly UnitYardConfig[]) {
  const normalizedConfigs = configs.map(normalizeUnitYardConfig)

  mockYardConfigMemoryStore.clear()
  for (const config of normalizedConfigs) {
    mockYardConfigMemoryStore.set(config.unitId, config)
  }

  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(UNIT_YARD_MOCK_STORAGE_KEY, JSON.stringify(normalizedConfigs))
  } catch {
    mockYardConfigMemoryStore.clear()
    for (const config of normalizedConfigs) {
      mockYardConfigMemoryStore.set(config.unitId, config)
    }
  }
}

function createMockUnitYardGateway(): UnitYardGateway {
  return {
    async listConfigs() {
      await Promise.resolve()
      return readStoredMockConfigs().sort((left, right) =>
        left.unitId.localeCompare(right.unitId, "pt-BR", { numeric: true })
      )
    },
    async upsertConfig(input) {
      await Promise.resolve()
      const config = normalizeUnitYardConfig({
        unitId: input.unitId,
        patioActive: input.patioActive,
        parkingSpots: input.parkingSpots,
        updatedAt: new Date().toISOString(),
      })
      const configs = readStoredMockConfigs()
      const nextConfigs = [
        ...configs.filter((item) => item.unitId !== config.unitId),
        config,
      ]

      writeStoredMockConfigs(nextConfigs)
      return config
    },
  }
}

function createSupabaseUnitYardGateway(): UnitYardGateway {
  return {
    async listConfigs() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.errors.unitYardLoad)
      }

      const listResponse = await supabase
        .from("unit_yard_configs")
        .select("unit_id, patio_active, parking_spots, updated_at")
        .order("unit_id", { ascending: true }) as unknown as { data: unknown; error: unknown }
      const { data, error } = listResponse

      if (error) {
        throw new Error(unitsCopy.errors.unitYardLoad, { cause: error })
      }

      return ((data ?? []) as RawUnitYardConfigRow[]).map(mapUnitYardConfig)
    },
    async upsertConfig(input) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.errors.unitYardSave)
      }

      const upsertResponse = await supabase
        .from("unit_yard_configs")
        .upsert({
          unit_id: input.unitId,
          patio_active: input.patioActive,
          parking_spots: input.parkingSpots,
          updated_at: new Date().toISOString(),
        }, { onConflict: "unit_id" })
        .select("unit_id, patio_active, parking_spots, updated_at")
        .single() as unknown as { data: unknown; error: unknown }
      const { data: upsertData, error: upsertError } = upsertResponse

      if (upsertError || !upsertData) {
        throw new Error(unitsCopy.errors.unitYardSave, { cause: upsertError })
      }

      return mapUnitYardConfig(upsertData as RawUnitYardConfigRow)
    },
  }
}

const mockUnitYardGateway = createMockUnitYardGateway()
const supabaseUnitYardGateway = createSupabaseUnitYardGateway()

function createDefaultUnitYardGateway(): UnitYardGateway {
  return {
    listConfigs() {
      return isErpCatalogMockEnabled()
        ? mockUnitYardGateway.listConfigs()
        : supabaseUnitYardGateway.listConfigs()
    },
    upsertConfig(input) {
      return isErpCatalogMockEnabled()
        ? mockUnitYardGateway.upsertConfig(input)
        : supabaseUnitYardGateway.upsertConfig(input)
    },
  }
}

let unitYardGateway: UnitYardGateway = createDefaultUnitYardGateway()

export function getUnitYardGateway() {
  return unitYardGateway
}

export function configureUnitYardGateway(gateway: UnitYardGateway) {
  unitYardGateway = gateway
}

export function resetUnitYardGateway() {
  unitYardGateway = createDefaultUnitYardGateway()
}
