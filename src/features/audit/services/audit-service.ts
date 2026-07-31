import { sanitizeAuditEventsPayload } from "../model"
import { type AuditEvent } from "../model"
import { getAuditGateway } from "./audit-gateway"

export async function listAuditEvents(): Promise<AuditEvent[]> {
  const payload = await getAuditGateway().listEvents()

  return sanitizeAuditEventsPayload(payload)
}
