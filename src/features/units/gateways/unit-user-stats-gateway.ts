import { createSupabaseUnitUserStatsGateway } from "./supabase-unit-user-stats-gateway"
import { type UnitUserStatsGateway } from "./units-gateway-contracts"

let activeUnitUserStatsGateway: UnitUserStatsGateway =
  createSupabaseUnitUserStatsGateway()

export function getUnitUserStatsGateway() {
  return activeUnitUserStatsGateway
}

export function setUnitUserStatsGateway(gateway: UnitUserStatsGateway) {
  activeUnitUserStatsGateway = gateway
}

export function resetUnitUserStatsGateway() {
  activeUnitUserStatsGateway = createSupabaseUnitUserStatsGateway()
}
