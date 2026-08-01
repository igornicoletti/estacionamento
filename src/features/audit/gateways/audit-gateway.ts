import { createSupabaseAuditGateway } from "./supabase-audit-gateway"
import { type AuditGateway } from "./audit-gateway-contracts"

let activeAuditGateway: AuditGateway = createSupabaseAuditGateway()

export function getAuditGateway() {
  return activeAuditGateway
}

export function setAuditGateway(gateway: AuditGateway) {
  activeAuditGateway = gateway
}

export function resetAuditGateway() {
  activeAuditGateway = createSupabaseAuditGateway()
}
