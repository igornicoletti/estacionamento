import { createSupabaseUsersGateway } from "./supabase-users-gateway"
import { type UsersGateway } from "./users-gateway-contracts"

let activeUsersGateway: UsersGateway = createSupabaseUsersGateway()

export function getUsersGateway() {
  return activeUsersGateway
}

export function setUsersGateway(gateway: UsersGateway) {
  activeUsersGateway = gateway
}

export function resetUsersGateway() {
  activeUsersGateway = createSupabaseUsersGateway()
}
