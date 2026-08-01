import { type AuditEventRowPayload } from "../schemas/audit-gateway-schema"

export interface AuditGatewayResult {
  isTruncated: boolean
  rows: readonly AuditEventRowPayload[]
}

export interface AuditGateway {
  listEvents(): Promise<AuditGatewayResult>
}
