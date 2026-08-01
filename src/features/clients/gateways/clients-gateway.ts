import { createSupabaseClientsGateway } from "./supabase-clients-gateway"
import { type ClientsGateway } from "./clients-gateway-contracts"

let activeClientsGateway: ClientsGateway = createSupabaseClientsGateway()

export function getClientsGateway() {
  return activeClientsGateway
}

export function setClientsGateway(gateway: ClientsGateway) {
  activeClientsGateway = gateway
}

export function resetClientsGateway() {
  activeClientsGateway = createSupabaseClientsGateway()
}
