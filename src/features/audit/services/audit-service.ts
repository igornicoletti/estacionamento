import { getAuditGateway } from "../gateways/audit-gateway"
import { sortAuditEvents, toAuditEvent } from "../model/audit-models"
import { type AuditSnapshot } from "../model/audit-types"

export async function listAuditEvents(): Promise<AuditSnapshot> {
  const result = await getAuditGateway().listEvents()

  return {
    events: sortAuditEvents(result.rows.map(toAuditEvent)),
    isTruncated: result.isTruncated,
  }
}
