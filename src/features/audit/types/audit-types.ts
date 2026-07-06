import { type UserRole } from "@/features/auth"

export const auditActionValues = [
  "auth.login",
  "auth.login_failed",
  "auth.logout",
  "auth.recovery_requested",
  "user.created",
  "user.updated",
  "user.disabled",
  "user.access_reset",
  "unit.synced",
  "unit.yard_updated",
  "client.synced",
  "permissions.viewed",
  "audit.exported",
  "settings.updated",
  "mfa.enrolled",
  "mfa.removed",
] as const

export type AuditAction = (typeof auditActionValues)[number]

export const auditActionLabels: Record<AuditAction, string> = {
  "auth.login": "Login realizado",
  "auth.login_failed": "Falha de login",
  "auth.logout": "Logout",
  "auth.recovery_requested": "Recuperação de acesso solicitada",
  "user.created": "Usuário criado",
  "user.updated": "Usuário atualizado",
  "user.disabled": "Usuário bloqueado",
  "user.access_reset": "Acesso redefinido",
  "unit.synced": "Unidade sincronizada",
  "unit.yard_updated": "Pátio da unidade atualizado",
  "client.synced": "Cliente sincronizado",
  "permissions.viewed": "Permissões consultadas",
  "audit.exported": "Auditoria exportada",
  "settings.updated": "Configurações atualizadas",
  "mfa.enrolled": "MFA adicionado",
  "mfa.removed": "MFA removido",
}

export const auditOutcomeValues = ["success", "failure", "denied"] as const

export type AuditOutcome = (typeof auditOutcomeValues)[number]

export const auditOutcomeLabels: Record<AuditOutcome, string> = {
  success: "Sucesso",
  failure: "Falha",
  denied: "Negado",
}

export function isAuditAction(value: unknown): value is AuditAction {
  return (
    typeof value === "string" &&
    auditActionValues.includes(value as AuditAction)
  )
}

export function isAuditOutcome(value: unknown): value is AuditOutcome {
  return (
    typeof value === "string" &&
    auditOutcomeValues.includes(value as AuditOutcome)
  )
}

/**
 * Shape of a raw audit event as it would arrive from an append-only audit log
 * (all fields untyped to force sanitization at the boundary).
 */
export interface RawAuditEventPayload {
  id: unknown
  occurred_at: unknown
  actor_name: unknown
  actor_role: unknown
  action: unknown
  outcome: unknown
  entity: unknown
  entity_id: unknown
  unit_name: unknown
  ip_address: unknown
  user_agent: unknown
  description: unknown
}

export interface AuditEvent {
  id: string
  /** ISO 8601 timestamp — sortable lexicographically. */
  occurredAt: string
  actorName: string
  actorRole: UserRole | null
  action: AuditAction
  outcome: AuditOutcome
  entity: string
  entityId: string
  unitName: string | null
  ipAddress: string
  userAgent: string
  description: string
}
