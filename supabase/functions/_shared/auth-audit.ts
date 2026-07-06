import { createAdminClient } from "./auth-supabase-admin.ts"

interface AuditEventInput {
  actor: string
  actorUserId?: string
  event: string
  ipHash?: string
  reason?: string
  requestId?: string
  scope: "login" | "system"
  severity?: "info" | "warning" | "critical"
  success: boolean
  target: string
  targetUserId?: string
  userAgentHash?: string
  metadata?: Record<string, unknown>
}

export async function writeAuditEvent(input: AuditEventInput) {
  const supabase = createAdminClient()

  await supabase.from("audit_events").insert({
    actor: input.actor,
    actor_user_id: input.actorUserId,
    event: input.event,
    ip_hash: input.ipHash,
    metadata: input.metadata ?? {},
    reason: input.reason,
    request_id: input.requestId,
    scope: input.scope,
    severity: input.severity ?? "info",
    success: input.success,
    target: input.target,
    target_user_id: input.targetUserId,
    user_agent_hash: input.userAgentHash,
  })
}
