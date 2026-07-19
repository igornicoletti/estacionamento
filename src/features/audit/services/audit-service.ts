import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { auditCopy, AUDIT_EVENTS_FETCH_LIMIT } from "../constants"
import {
  sanitizeAuditEventsPayload,
  type AuditEvent,
  type RawAuditEventPayload,
} from "../model"

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

export interface AuditEventsResult {
  events: AuditEvent[]
  isTruncated: boolean
  limit: number
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(auditCopy.feedback.loadError)
  }

  return supabase
}

export async function listAuditEvents(): Promise<AuditEventsResult> {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase
    .from("audit_events")
    .select(AUDIT_EVENTS_SELECT)
    .order("occurred_at", { ascending: false })
    .limit(AUDIT_EVENTS_FETCH_LIMIT + 1)

  if (error) {
    throw new Error(auditCopy.feedback.loadError, { cause: error })
  }

  const rows = (data ?? []) as unknown as RawAuditEventPayload[]
  const isTruncated = rows.length > AUDIT_EVENTS_FETCH_LIMIT

  return {
    events: sanitizeAuditEventsPayload(rows.slice(0, AUDIT_EVENTS_FETCH_LIMIT)),
    isTruncated,
    limit: AUDIT_EVENTS_FETCH_LIMIT,
  }
}
