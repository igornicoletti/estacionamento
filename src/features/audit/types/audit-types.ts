export const auditScopeValues = ["login", "system"] as const

export type AuditScope = (typeof auditScopeValues)[number]

export const auditScopeLabels: Record<AuditScope, string> = {
  login: "Login",
  system: "Sistema",
}

export const auditSeverityValues = ["info", "warning", "critical"] as const

export type AuditSeverity = (typeof auditSeverityValues)[number]

export const auditSeverityLabels: Record<AuditSeverity, string> = {
  info: "Informativo",
  warning: "Atenção",
  critical: "Crítico",
}

/**
 * Labels for the real event codes written by `writeAuditEvent` across the
 * Edge Functions. Event codes are free-form text in the database (mixed
 * snake_case and dotted namespaces), so this map is intentionally partial —
 * `getAuditEventLabel` falls back to humanizing unknown codes so new events
 * never break the UI.
 */
export const auditEventLabels: Record<string, string> = {
  account_locked: "Conta bloqueada",
  access_recovery_requested: "Recuperação de acesso solicitada",
  access_recovery_reviewed: "Recuperação de acesso revisada",
  "client.synced": "Cliente sincronizado",
  login_failed: "Falha de login",
  login_success: "Login realizado",
  login_passkey_success: "Login com passkey",
  passkey_registered: "Passkey registrada",
  passkey_reset_requested: "Redefinição de passkey solicitada",
  password_changed: "Senha alterada",
  password_reset_requested: "Redefinição de senha solicitada",
  phone_change_requested: "Alteração de telefone solicitada",
  phone_change_reviewed: "Alteração de telefone revisada",
  profile_updated: "Perfil atualizado",
  sessions_revoked: "Sessões revogadas",
  temporary_lock_cleared: "Bloqueio temporário removido",
  "unit.synced": "Unidade sincronizada",
  user_blocked: "Usuário bloqueado",
  user_created: "Usuário criado",
  user_updated: "Usuário atualizado",
}

export function getAuditEventLabel(event: string): string {
  if (event in auditEventLabels) {
    return auditEventLabels[event]
  }

  const humanized = event
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")

  if (!humanized) {
    return event
  }

  return humanized.charAt(0).toUpperCase() + humanized.slice(1)
}

export function isAuditScope(value: unknown): value is AuditScope {
  return (
    typeof value === "string" &&
    auditScopeValues.includes(value as AuditScope)
  )
}

export function isAuditSeverity(value: unknown): value is AuditSeverity {
  return (
    typeof value === "string" &&
    auditSeverityValues.includes(value as AuditSeverity)
  )
}

/**
 * Shape of a raw row as it arrives from the real, append-only
 * `public.audit_events` table (RLS restricts reads to owner/admin/auditor).
 * Fields are left untyped to force sanitization at the boundary.
 */
export interface RawAuditEventPayload {
  id: unknown
  occurred_at: unknown
  scope: unknown
  event: unknown
  actor: unknown
  actor_user_id: unknown
  target: unknown
  target_user_id: unknown
  success: unknown
  severity: unknown
  reason: unknown
  request_id: unknown
  metadata: unknown
}

export interface AuditEvent {
  id: string
  /** ISO 8601 timestamp — sortable lexicographically. */
  occurredAt: string
  scope: AuditScope
  event: string
  eventLabel: string
  actorName: string
  actorUserId: string | null
  target: string
  targetUserId: string | null
  success: boolean
  severity: AuditSeverity
  reason: string | null
  requestId: string | null
  metadata: Record<string, unknown> | null
}
