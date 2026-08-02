import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { securityCopy } from "../constants/security-copy"
import {
  securityAuditEventRowsSchema,
  type SecurityAuditEventRow,
} from "../schemas/security-events-schema"
import { type SecurityEventSummary } from "../types/security-types"

function resolveEventTone(
  row: Pick<SecurityAuditEventRow, "severity" | "success">
): SecurityEventSummary["tone"] {
  return row.success && row.severity === "info" ? "success" : "warning"
}

function mapAuditEvent(row: SecurityAuditEventRow): SecurityEventSummary {
  const copy = securityCopy.auditEvents[row.event_code]

  return {
    description: copy.description,
    id: row.event_id,
    occurredAt: row.occurred_at,
    title: copy.title,
    tone: resolveEventTone(row),
  }
}

export async function getCurrentSecurityEvents(): Promise<
  SecurityEventSummary[]
> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(securityCopy.events.error)
  }

  const response = await supabase.rpc("get_current_security_events")

  if (response.error) {
    throw new Error(securityCopy.events.error, { cause: response.error })
  }

  const parsed = securityAuditEventRowsSchema.safeParse(response.data ?? [])

  if (!parsed.success) {
    throw new Error(securityCopy.events.error, { cause: parsed.error })
  }

  return parsed.data.map(mapAuditEvent)
}
