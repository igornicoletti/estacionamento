import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { type UnitYardConfig } from "../types/units-types"

export interface UnitYardGateway {
  list(): Promise<UnitYardConfig[]>
  upsertOne(config: UnitYardConfig): Promise<void>
}

type RawUnitYardRow = {
  unit_id: number | string
  patio_active: boolean
  parking_spots: number
  updated_at: string
}

function createSupabaseUnitYardGateway(): UnitYardGateway {
  return {
    async list() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from("unit_yard_configs")
        .select("unit_id, patio_active, parking_spots, updated_at")

      if (error) {
        throw new Error(error.message)
      }

      return ((data ?? []) as RawUnitYardRow[]).map((row) => ({
        unitId: String(row.unit_id),
        patioActive: Boolean(row.patio_active),
        parkingSpots: Number(row.parking_spots),
        updatedAt: row.updated_at,
      }))
    },
    async upsertOne(config) {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error("Supabase indisponível para salvar pátio.")
      }

      const unitId = Number(config.unitId)

      if (!Number.isFinite(unitId)) {
        throw new Error("Identificador de unidade inválido para salvar pátio.")
      }

      const { error: upsertError } = await supabase
        .from("unit_yard_configs")
        .upsert(
          [{
            unit_id: unitId,
            patio_active: config.patioActive,
            parking_spots: config.parkingSpots,
            updated_at: config.updatedAt,
          }],
          { onConflict: "unit_id" }
        )

      if (upsertError) {
        throw new Error(upsertError.message)
      }
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
