import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { auditCopy } from "../constants/audit-copy"
import { AUDIT_EVENTS_FETCH_LIMIT } from "../constants/audit-persistence"
import { auditEventRowsSchema } from "../schemas/audit-gateway-schema"
import { type AuditGateway } from "./audit-gateway-contracts"

const AUDIT_EVENTS_SELECT =
  "id, occurred_at, scope, event, actor, actor_user_id, target, target_user_id, success, severity, reason, request_id, metadata"

export function createSupabaseAuditGateway(): AuditGateway {
  return {
    async listEvents() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(auditCopy.feedback.loadError)
      }

      const { data, error } = await supabase
        .from("audit_events")
        .select(AUDIT_EVENTS_SELECT)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, AUDIT_EVENTS_FETCH_LIMIT)

      if (error) {
        throw new Error(auditCopy.feedback.loadError, { cause: error })
      }

      const result = auditEventRowsSchema.safeParse(data ?? [])

      if (!result.success) {
        throw new Error(auditCopy.feedback.loadError, { cause: result.error })
      }

      return {
        isTruncated: result.data.length > AUDIT_EVENTS_FETCH_LIMIT,
        rows: result.data.slice(0, AUDIT_EVENTS_FETCH_LIMIT),
      }
    },
  }
}
