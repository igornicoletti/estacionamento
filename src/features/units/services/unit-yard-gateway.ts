import { z } from "zod"

import { isErpCatalogMockEnabled } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_YARD_MOCK_STORAGE_KEY } from "../constants/units-persistence"
import {
  normalizeUnitYardConfig,
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "../model"

export interface UnitYardGateway {
  listConfigs: () => Promise<readonly UnitYardConfig[]>
  upsertConfig: (input: UpsertUnitYardConfigInput) => Promise<UnitYardConfig>
}

const rawUnitYardConfigRowSchema = z.object({
  unit_id: z.string().trim().min(1),
  patio_active: z.boolean(),
  parking_spots: z.number(),
  updated_at: z.string().trim().min(1),
})

const storedUnitYardConfigSchema = z.object({
  unitId: z.string().trim().min(1),
  patioActive: z.boolean(),
  parkingSpots: z.number(),
  updatedAt: z.string().trim().min(1),
})

const supabaseResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z.unknown().nullable(),
}).passthrough()

const rawUnitYardConfigRowsSchema = z.array(rawUnitYardConfigRowSchema)
const storedUnitYardConfigsSchema = z.array(storedUnitYardConfigSchema)

type RawUnitYardConfigRow = z.infer<typeof rawUnitYardConfigRowSchema>
type StoredUnitYardConfig = z.infer<typeof storedUnitYardConfigSchema>

const mockYardConfigMemoryStore = new Map<string, UnitYardConfig>()

function mapUnitYardConfig(row: RawUnitYardConfigRow): UnitYardConfig {
  return normalizeUnitYardConfig({
    unitId: row.unit_id,
    patioActive: row.patio_active,
    parkingSpots: row.parking_spots,
    updatedAt: row.updated_at,
  })
}

function mapStoredUnitYardConfig(config: StoredUnitYardConfig): UnitYardConfig {
  return normalizeUnitYardConfig({
    unitId: config.unitId,
    patioActive: config.patioActive,
    parkingSpots: config.parkingSpots,
    updatedAt: config.updatedAt,
  })
}

function parseSupabaseResponse(value: unknown, errorMessage: string) {
  const result = supabaseResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(errorMessage, { cause: result.error })
  }

  if (result.data.error) {
    throw new Error(errorMessage, { cause: result.data.error })
  }

  return result.data.data
}

function parseRawUnitYardConfigRows(value: unknown) {
  const result = rawUnitYardConfigRowsSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(unitsCopy.errors.unitYardLoad, { cause: result.error })
  }

  return result.data.map(mapUnitYardConfig)
}

function parseRawUnitYardConfigRow(value: unknown) {
  const result = rawUnitYardConfigRowSchema.safeParse(value)

  if (!result.success) {
    throw new Error(unitsCopy.errors.unitYardSave, { cause: result.error })
  }

  return mapUnitYardConfig(result.data)
}

function parseStoredMockConfigs(value: unknown) {
  const result = storedUnitYardConfigsSchema.safeParse(value)

  if (!result.success) {
    return []
  }

  return result.data.map(mapStoredUnitYardConfig)
}

function readStoredMockConfigs(): UnitYardConfig[] {
  if (typeof window === "undefined") {
    return Array.from(mockYardConfigMemoryStore.values()).map(normalizeUnitYardConfig)
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(UNIT_YARD_MOCK_STORAGE_KEY) ?? "[]")

    return parseStoredMockConfigs(parsed)
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

      const response: unknown = await supabase
        .from("unit_yard_configs")
        .select("unit_id, patio_active, parking_spots, updated_at")
        .order("unit_id", { ascending: true })
      const data = parseSupabaseResponse(response, unitsCopy.errors.unitYardLoad)

      return parseRawUnitYardConfigRows(data)
    },
    async upsertConfig(input) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.errors.unitYardSave)
      }

      const response: unknown = await supabase
        .from("unit_yard_configs")
        .upsert({
          unit_id: input.unitId,
          patio_active: input.patioActive,
          parking_spots: input.parkingSpots,
          updated_at: new Date().toISOString(),
        }, { onConflict: "unit_id" })
        .select("unit_id, patio_active, parking_spots, updated_at")
        .single()
      const data = parseSupabaseResponse(response, unitsCopy.errors.unitYardSave)

      return parseRawUnitYardConfigRow(data)
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
