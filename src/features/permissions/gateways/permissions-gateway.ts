import { type PermissionsGateway } from "./permissions-gateway-contracts"
import { createSupabasePermissionsGateway } from "./supabase-permissions-gateway"

let activePermissionsGateway: PermissionsGateway =
  createSupabasePermissionsGateway()

export function getPermissionsGateway() {
  return activePermissionsGateway
}

export function setPermissionsGateway(gateway: PermissionsGateway) {
  activePermissionsGateway = gateway
}

export function resetPermissionsGateway() {
  activePermissionsGateway = createSupabasePermissionsGateway()
}
