import { getCurrentSessionProfile } from "@/features/auth/services"

import {
  type AuditAction,
  type AuditEvent,
  type AuditOutcome,
  type RawAuditEventPayload,
} from "../types/audit-types"
import { sanitizeAuditEventsPayload } from "../utils/audit-normalizers"

/**
 * Simulated append-only audit trail. In production this data would come from an
 * immutable audit log table (RLS-protected, insert-only). The payload is left
 * intentionally "raw" so the normalization boundary is exercised end-to-end.
 */
const simulatedAuditPayload: RawAuditEventPayload[] = [
  {
    id: "aud_0001",
    occurred_at: "2026-07-02T13:42:11Z",
    actor_name: "Igor Nicoletti",
    actor_role: "admin",
    action: "user.created",
    outcome: "success",
    entity: "Usuário",
    entity_id: "usr_2098",
    unit_name: "Matriz",
    ip_address: "189.24.10.4",
    user_agent: "Chrome 141 / Windows",
    description: "Novo usuário operador cadastrado para a unidade Centro.",
  },
  {
    id: "aud_0002",
    occurred_at: "2026-07-02T13:05:47Z",
    actor_name: "Sistema",
    actor_role: null,
    action: "auth.login_failed",
    outcome: "failure",
    entity: "Sessão",
    entity_id: "cpf:***.***.***-25",
    unit_name: null,
    ip_address: "45.231.88.190",
    user_agent: "Firefox 142 / Linux",
    description: "Tentativa de login com senha inválida (3ª tentativa).",
  },
  {
    id: "aud_0003",
    occurred_at: "2026-07-02T12:58:03Z",
    actor_name: "Marina Souza",
    actor_role: "auditor",
    action: "permissions.viewed",
    outcome: "success",
    entity: "Perfil e Permissões",
    entity_id: "matrix",
    unit_name: null,
    ip_address: "200.148.33.7",
    user_agent: "Edge 141 / Windows",
    description: "Consulta à matriz de perfis e permissões.",
  },
  {
    id: "aud_0004",
    occurred_at: "2026-07-02T11:20:19Z",
    actor_name: "Rede Monte Carlo",
    actor_role: null,
    action: "unit.synced",
    outcome: "success",
    entity: "Unidade",
    entity_id: "emp_3",
    unit_name: "Monte Carlo Sul",
    ip_address: "10.0.0.5",
    user_agent: "ERP Sync Worker",
    description: "Sincronização automática de unidades a partir do ERP.",
  },
  {
    id: "aud_0005",
    occurred_at: "2026-07-02T10:12:55Z",
    actor_name: "Paulo Mendes",
    actor_role: "owner",
    action: "user.disabled",
    outcome: "success",
    entity: "Usuário",
    entity_id: "usr_1875",
    unit_name: "Zona Sul",
    ip_address: "177.10.55.201",
    user_agent: "Chrome 141 / macOS",
    description: "Usuário bloqueado após desligamento.",
  },
  {
    id: "aud_0006",
    occurred_at: "2026-07-02T09:47:38Z",
    actor_name: "Carlos Lima",
    actor_role: "operator",
    action: "permissions.viewed",
    outcome: "denied",
    entity: "Perfil e Permissões",
    entity_id: "matrix",
    unit_name: "Leste",
    ip_address: "191.6.77.34",
    user_agent: "Chrome 140 / Android",
    description: "Acesso negado à auditoria por falta de permissão.",
  },
  {
    id: "aud_0007",
    occurred_at: "2026-07-02T08:30:02Z",
    actor_name: "Marina Souza",
    actor_role: "auditor",
    action: "audit.exported",
    outcome: "success",
    entity: "Auditoria",
    entity_id: "export",
    unit_name: null,
    ip_address: "200.148.33.7",
    user_agent: "Edge 141 / Windows",
    description: "Exportação da trilha de auditoria em Excel.",
  },
  {
    id: "aud_0008",
    occurred_at: "2026-07-01T19:14:41Z",
    actor_name: "Igor Nicoletti",
    actor_role: "admin",
    action: "user.access_reset",
    outcome: "success",
    entity: "Usuário",
    entity_id: "usr_1042",
    unit_name: "Matriz",
    ip_address: "189.24.10.4",
    user_agent: "Chrome 141 / Windows",
    description: "Redefinição de senha de primeiro acesso.",
  },
  {
    id: "aud_0009",
    occurred_at: "2026-07-01T18:02:27Z",
    actor_name: "Ana Prado",
    actor_role: "manager",
    action: "auth.login",
    outcome: "success",
    entity: "Sessão",
    entity_id: "sess_88213",
    unit_name: "Oeste",
    ip_address: "179.208.4.90",
    user_agent: "Safari 19 / iOS",
    description: "Login realizado com passkey.",
  },
  {
    id: "aud_0010",
    occurred_at: "2026-07-01T17:41:09Z",
    actor_name: "Ana Prado",
    actor_role: "manager",
    action: "mfa.enrolled",
    outcome: "success",
    entity: "MFA",
    entity_id: "mfa_5521",
    unit_name: "Oeste",
    ip_address: "179.208.4.90",
    user_agent: "Safari 19 / iOS",
    description: "Novo aplicativo autenticador vinculado.",
  },
  {
    id: "aud_0011",
    occurred_at: "2026-07-01T16:20:00Z",
    actor_name: "Sistema",
    actor_role: null,
    action: "client.synced",
    outcome: "success",
    entity: "Cliente",
    entity_id: "cli_1001",
    unit_name: null,
    ip_address: "10.0.0.5",
    user_agent: "ERP Sync Worker",
    description: "Sincronização de clientes a partir do ERP.",
  },
  {
    id: "aud_0012",
    occurred_at: "2026-07-01T14:05:53Z",
    actor_name: "Carlos Lima",
    actor_role: "operator",
    action: "auth.recovery_requested",
    outcome: "success",
    entity: "Recuperação de acesso",
    entity_id: "rec_7781",
    unit_name: "Leste",
    ip_address: "191.6.77.34",
    user_agent: "Chrome 140 / Android",
    description: "Solicitação de recuperação de acesso por perda de dispositivo.",
  },
  {
    id: "aud_0013",
    occurred_at: "2026-07-01T11:33:12Z",
    actor_name: "Paulo Mendes",
    actor_role: "owner",
    action: "settings.updated",
    outcome: "success",
    entity: "Configurações",
    entity_id: "cfg_global",
    unit_name: null,
    ip_address: "177.10.55.201",
    user_agent: "Chrome 141 / macOS",
    description: "Atualização das preferências de exibição.",
  },
  {
    id: "aud_0014",
    occurred_at: "2026-06-30T22:18:44Z",
    actor_name: "Marina Souza",
    actor_role: "auditor",
    action: "mfa.removed",
    outcome: "success",
    entity: "MFA",
    entity_id: "mfa_3390",
    unit_name: null,
    ip_address: "200.148.33.7",
    user_agent: "Edge 141 / Windows",
    description: "Remoção de aplicativo autenticador comprometido.",
  },
]

const STORAGE_KEY = "rmc.audit.events.v1"

export interface AppendAuditEventInput {
  action: AuditAction
  entity: string
  entityId: string
  outcome?: AuditOutcome
  description: string
  unitName?: string | null
  actorName?: string
  actorRole?: string | null
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readStoredAuditEvents() {
  if (!canUseStorage()) {
    return [] as RawAuditEventPayload[]
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return [] as RawAuditEventPayload[]
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return [] as RawAuditEventPayload[]
    }

    return parsed.filter((event): event is RawAuditEventPayload => {
      return Boolean(event) && typeof event === "object"
    })
  } catch {
    return [] as RawAuditEventPayload[]
  }
}

function writeStoredAuditEvents(events: readonly RawAuditEventPayload[]) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // Quota exceeded or storage unavailable — silently skip persistence.
  }
}

async function getAuditActorContext(input: AppendAuditEventInput) {
  if (input.actorName) {
    return {
      actorName: input.actorName,
      actorRole: input.actorRole ?? null,
    }
  }

  const profile = await getCurrentSessionProfile()

  return {
    actorName: profile?.name ?? "Sistema",
    actorRole: profile?.role ?? null,
  }
}

export async function listAuditEvents(): Promise<AuditEvent[]> {
  await Promise.resolve()

  return sanitizeAuditEventsPayload([
    ...readStoredAuditEvents(),
    ...simulatedAuditPayload,
  ])
}

export async function appendAuditEvent(input: AppendAuditEventInput) {
  const actorContext = await getAuditActorContext(input)
  const currentEvents = readStoredAuditEvents()
  const nextEvent: RawAuditEventPayload = {
    id: globalThis.crypto?.randomUUID?.() ?? `audit_${Date.now()}`,
    occurred_at: new Date().toISOString(),
    actor_name: actorContext.actorName,
    actor_role: actorContext.actorRole,
    action: input.action,
    outcome: input.outcome ?? "success",
    entity: input.entity,
    entity_id: input.entityId,
    unit_name: input.unitName ?? null,
    ip_address: "local",
    user_agent: "Web App",
    description: input.description,
  }

  writeStoredAuditEvents([nextEvent, ...currentEvents])

  return sanitizeAuditEventsPayload([nextEvent])[0]
}
