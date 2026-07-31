import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { AUDIT_EVENTS_FETCH_LIMIT, auditCopy } from "../constants"
import { type RawAuditEventPayload } from "../model"

export interface AuditGateway {
  listEvents(): Promise<readonly RawAuditEventPayload[]>
}

const auditEventRowSchema = z
  .object({
    actor: z.string(),
    actor_user_id: z.string().nullable(),
    event: z.string(),
    id: z.string(),
    metadata: z.unknown(),
    occurred_at: z.string(),
    reason: z.string().nullable(),
    request_id: z.string().nullable(),
    scope: z.string(),
    severity: z.string(),
    success: z.boolean(),
    target: z.string(),
    target_user_id: z.string().nullable(),
  })
  .passthrough()

const auditEventRowsSchema = z.array(auditEventRowSchema)

function createSupabaseAuditGateway(): AuditGateway {
  return {
    async listEvents() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(auditCopy.feedback.loadError)
      }

      const { data, error } = await supabase
        .from("audit_events")
        .select(
          "id, occurred_at, scope, event, actor, actor_user_id, target, target_user_id, success, severity, reason, request_id, metadata"
        )
        .order("occurred_at", { ascending: false })
        .limit(AUDIT_EVENTS_FETCH_LIMIT)

      if (error) {
        throw new Error(auditCopy.feedback.loadError, { cause: error })
      }

      const result = auditEventRowsSchema.safeParse(data ?? [])

      if (!result.success) {
        throw new Error(auditCopy.feedback.loadError, { cause: result.error })
      }

      return result.data
    },
  }
}

let auditGateway: AuditGateway = createSupabaseAuditGateway()

export function configureAuditGateway(gateway: AuditGateway) {
  auditGateway = gateway
}

export function getAuditGateway() {
  return auditGateway
}

export function resetAuditGateway() {
  auditGateway = createSupabaseAuditGateway()
}
