import { createSupabaseUnitsGateway } from "./supabase-units-gateway"
import { type UnitsGateway } from "./units-gateway-contracts"

let activeUnitsGateway: UnitsGateway = createSupabaseUnitsGateway()

export function getUnitsGateway() {
  return activeUnitsGateway
}

export function setUnitsGateway(gateway: UnitsGateway) {
  activeUnitsGateway = gateway
}

export function resetUnitsGateway() {
  activeUnitsGateway = createSupabaseUnitsGateway()
}
