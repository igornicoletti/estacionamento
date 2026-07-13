import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
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

function mapUnitYardConfig(row: RawUnitYardConfigRow): UnitYardConfig {
  return {
    unitId: row.unit_id,
    patioActive: row.patio_active,
    parkingSpots: row.parking_spots,
    updatedAt: row.updated_at,
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
        throw new Error(error.message)
      }

      return ((data ?? []) as RawUnitYardConfigRow[]).map(mapUnitYardConfig)
    },
    async upsertConfig(input) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error("Supabase não configurado.")
      }

      const { data, error } = await supabase
        .from("unit_yard_configs")
        .upsert({
          unit_id: input.unitId,
          unit_name: input.unitName ?? null,
          patio_active: input.patioActive,
          parking_spots: input.parkingSpots,
          updated_at: new Date().toISOString(),
        }, { onConflict: "unit_id" })
        .select("unit_id, patio_active, parking_spots, updated_at")
        .single()

      if (error || !data) {
        throw new Error(error?.message ?? "Não foi possível salvar a configuração de pátio.")
      }

      return mapUnitYardConfig(data)
    },
  }
}

let unitYardGateway: UnitYardGateway = createSupabaseUnitYardGateway()

export function getUnitYardGateway() {
  return unitYardGateway
}

export function configureUnitYardGateway(gateway: UnitYardGateway) {
  unitYardGateway = gateway
}

export function resetUnitYardGateway() {
  unitYardGateway = createSupabaseUnitYardGateway()
}
