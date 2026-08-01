import { createSupabaseUnitYardGateway } from "./supabase-unit-yard-gateway"
import { type UnitYardGateway } from "./units-gateway-contracts"

let activeUnitYardGateway: UnitYardGateway =
  createSupabaseUnitYardGateway()

export function getUnitYardGateway() {
  return activeUnitYardGateway
}

export function setUnitYardGateway(gateway: UnitYardGateway) {
  activeUnitYardGateway = gateway
}

export function resetUnitYardGateway() {
  activeUnitYardGateway = createSupabaseUnitYardGateway()
}
