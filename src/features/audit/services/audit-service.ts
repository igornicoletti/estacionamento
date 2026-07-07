import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { type AuditEvent, type RawAuditEventPayload } from "../types/audit-types"
import { sanitizeAuditEventsPayload } from "../utils/audit-normalizers"

const AUDIT_EVENTS_SELECT = [
  "id",
  "occurred_at",
  "scope",
  "event",
  "actor",
  "actor_user_id",
  "target",
  "target_user_id",
  "success",
  "severity",
  "reason",
  "request_id",
  "metadata",
].join(",")

const AUDIT_EVENTS_FETCH_LIMIT = 500

/**
 * Reads from the real, append-only `public.audit_events` table. RLS
 * restricts visible rows to actors whose `app_users` role is
 * owner/admin/auditor, so callers without that role will simply get an
 * empty (or Supabase-error) result rather than seeing other users' data.
 */
export async function listAuditEvents(): Promise<AuditEvent[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("audit_events")
    .select(AUDIT_EVENTS_SELECT)
    .order("occurred_at", { ascending: false })
    .limit(AUDIT_EVENTS_FETCH_LIMIT)

  if (error) {
    throw new Error(error.message)
  }

  return sanitizeAuditEventsPayload(
    (data ?? []) as unknown as RawAuditEventPayload[]
  )
}
