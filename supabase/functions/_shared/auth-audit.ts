import { createAdminClient } from "./auth-supabase-admin.ts"
import { hashSensitiveValue } from "./auth-cpf.ts"

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
  request?: Request
}

export async function writeAuditEvent(input: AuditEventInput) {
  const supabase = createAdminClient()
  const request = input.request
  const ip = request?.headers.get("x-forwarded-for")
  const userAgent = request?.headers.get("user-agent")

  const { error } = await supabase.from("audit_events").insert({
    actor: input.actor,
    actor_user_id: input.actorUserId,
    event: input.event,
    ip_hash: input.ipHash ?? (ip ? await hashSensitiveValue(ip) : undefined),
    metadata: input.metadata ?? {},
    reason: input.reason,
    request_id: input.requestId,
    scope: input.scope,
    severity: input.severity ?? "info",
    success: input.success,
    target: input.target,
    target_user_id: input.targetUserId,
    user_agent_hash: input.userAgentHash ?? (userAgent ? await hashSensitiveValue(userAgent) : undefined),
  })

  if (error) {
    console.error("[audit:write-failed]", {
      event: input.event,
      error: error.message,
    })
  }
}
