import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { unitsCopy } from "../units-copy"
import { type UnitYardConfig, type UpsertUnitYardConfigInput } from "../types/units-types"

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

const mockYardStorageKey = "rmc.units.mock-yard-configs.v1"
const mockYardConfigMemoryStore = new Map<string, UnitYardConfig>()

function mapUnitYardConfig(row: RawUnitYardConfigRow): UnitYardConfig {
  return {
    unitId: row.unit_id,
    patioActive: row.patio_active,
    parkingSpots: row.parking_spots,
    updatedAt: row.updated_at,
  }
}

function normalizeConfig(config: UnitYardConfig): UnitYardConfig {
  return {
    unitId: String(config.unitId),
    patioActive: Boolean(config.patioActive),
    parkingSpots: Number.isFinite(config.parkingSpots)
      ? Math.max(0, Math.trunc(config.parkingSpots))
      : 0,
    updatedAt: config.updatedAt || new Date().toISOString(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readStoredMockConfigs(): UnitYardConfig[] {
  if (typeof window === "undefined") {
    return Array.from(mockYardConfigMemoryStore.values()).map(normalizeConfig)
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(mockYardStorageKey) ?? "[]")

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
        configs.push(normalizeConfig({
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
  const normalizedConfigs = configs.map(normalizeConfig)

  mockYardConfigMemoryStore.clear()
  for (const config of normalizedConfigs) {
    mockYardConfigMemoryStore.set(config.unitId, config)
  }

  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(mockYardStorageKey, JSON.stringify(normalizedConfigs))
  } catch {
    // The in-memory store above still keeps mock edits working for this session.
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

      const config = normalizeConfig({
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
        return []
      }

      const { data, error } = await supabase
        .from("unit_yard_configs")
        .select("unit_id, patio_active, parking_spots, updated_at")
        .order("unit_id", { ascending: true })

      if (error) {
        throw new Error(unitsCopy.errors.unitYardLoad)
      }

      return ((data ?? []) as RawUnitYardConfigRow[]).map(mapUnitYardConfig)
    },
    async upsertConfig(input) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.errors.unitYardSave)
      }

      const { data, error } = await supabase
        .from("unit_yard_configs")
        .upsert({
          unit_id: input.unitId,
          patio_active: input.patioActive,
          parking_spots: input.parkingSpots,
          updated_at: new Date().toISOString(),
        }, { onConflict: "unit_id" })
        .select("unit_id, patio_active, parking_spots, updated_at")
        .single()

      if (error || !data) {
        throw new Error(unitsCopy.errors.unitYardSave)
      }

      return mapUnitYardConfig(data)
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
