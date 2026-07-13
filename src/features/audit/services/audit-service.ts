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

export interface AuditEventsResult {
  events: AuditEvent[]
  isTruncated: boolean
  limit: number
}

/**
 * Reads from the real, append-only `public.audit_events` table. RLS
 * restricts visible rows to actors whose `app_users` role is
 * owner/admin/auditor, so callers without that role will simply get an
 * empty (or Supabase-error) result rather than seeing other users' data.
 */
export async function listAuditEvents(): Promise<AuditEventsResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return {
      events: [],
      isTruncated: false,
      limit: AUDIT_EVENTS_FETCH_LIMIT,
    }
  }

  const { data, error } = await supabase
    .from("audit_events")
    .select(AUDIT_EVENTS_SELECT)
    .order("occurred_at", { ascending: false })
    .limit(AUDIT_EVENTS_FETCH_LIMIT + 1)

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as unknown as RawAuditEventPayload[]
  const isTruncated = rows.length > AUDIT_EVENTS_FETCH_LIMIT

  return {
    events: sanitizeAuditEventsPayload(rows.slice(0, AUDIT_EVENTS_FETCH_LIMIT)),
    isTruncated,
    limit: AUDIT_EVENTS_FETCH_LIMIT,
  }
}
