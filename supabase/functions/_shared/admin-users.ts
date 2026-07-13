import { getCorsHeaders, handleCors } from "./auth-cors.ts"
import {
  createAdminClient,
  createAuthorizedClient,
  type EdgeSupabaseClient,
  type Json,
} from "./auth-supabase-admin.ts"

export type AdminRole = "owner" | "admin" | "auditor" | "manager" | "operator"

export interface AppUserRow {
  id: string
  auth_user_id: string
  name: string
  role: AdminRole
  status: string
}

export interface AdminActionContext {
  admin: EdgeSupabaseClient
  actor: AppUserRow
  target: AppUserRow
  reason: string | null
  request: Request
}

type AuditMetadata = { [key: string]: Json | undefined }

export function handleAdminCors(request: Request) {
  return handleCors(request)
}

export function jsonResponse(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      "Content-Type": "application/json",
    },
  })
}

export function errorResponse(request: Request, message: string, status = 400, code = "admin_user_action_failed") {
  return jsonResponse(request, { ok: false, code, message }, status)
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()

    return body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {}
  } catch {
    return {}
  }
}

function isManagementRole(role: string | null | undefined) {
  return role === "owner" || role === "admin"
}

export function isGlobalRole(role: string) {
  return role === "owner" || role === "admin" || role === "auditor"
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function readAdminRole(value: unknown): AdminRole | null {
  return value === "owner" ||
      value === "admin" ||
      value === "auditor" ||
      value === "manager" ||
      value === "operator"
    ? value
    : null
}

function parseAppUserRow(value: Record<string, unknown>): AppUserRow {
  const id = readString(value.id)
  const authUserId = readString(value.auth_user_id)
  const name = readString(value.name)
  const role = readAdminRole(value.role)
  const status = readString(value.status)

  if (!id || !authUserId || !name || !role || !status) {
    throw new Error("Cadastro de usuário inválido.")
  }

  return {
    id,
    auth_user_id: authUserId,
    name,
    role,
    status,
  }
}

export function canAssignRole(actor: AppUserRow, role: string) {
  if (actor.role === "owner") {
    return true
  }

  return role !== "owner"
}

function canManageTarget(actor: AppUserRow, target: AppUserRow) {
  if (actor.auth_user_id === target.auth_user_id) {
    return false
  }

  if (actor.role === "owner") {
    return true
  }

  return actor.role === "admin" && target.role !== "owner"
}

async function getSessionUserId(request: Request) {
  const authorization = request.headers.get("Authorization") ?? request.headers.get("authorization")

  if (!authorization) {
    throw new Error("Sessão ausente.")
  }

  const userClient = createAuthorizedClient(authorization)
  const userResponse = await userClient.auth.getUser()

  if (userResponse.error || !userResponse.data.user) {
    throw new Error("Sessão inválida.")
  }

  return userResponse.data.user.id
}

export async function getAppUserByAuthUserId(
  admin: EdgeSupabaseClient,
  authUserId: string
) {
  const response = await admin
    .from("app_users")
    .select("id, auth_user_id, name, role, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle()

  if (response.error || !response.data) {
    throw new Error("Usuário não encontrado.")
  }

  return parseAppUserRow(response.data)
}

async function recordAudit(
  admin: EdgeSupabaseClient,
  actor: AppUserRow | null,
  event: string,
  target: AppUserRow | null,
  reason: string | null,
  success: boolean,
  metadata: AuditMetadata = {}
) {
  await admin.from("audit_events").insert({
    actor: actor?.name ?? "unknown",
    actor_user_id: actor?.auth_user_id ?? null,
    event,
    metadata,
    reason,
    scope: "system",
    severity: success ? "info" : "warning",
    success,
    target: target?.name ?? "unknown",
    target_user_id: target?.auth_user_id ?? null,
  })
}

export async function createAdminActionContext(
  request: Request
): Promise<AdminActionContext> {
  const body = await readJsonBody(request)
  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : ""
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null

  if (!targetUserId) {
    throw new Error("Usuário alvo não informado.")
  }

  const admin = createAdminClient()
  const actorAuthUserId = await getSessionUserId(request)
  const actor = await getAppUserByAuthUserId(admin, actorAuthUserId)
  const target = await getAppUserByAuthUserId(admin, targetUserId)

  if (actor.status !== "active" || !isManagementRole(actor.role)) {
    await recordAudit(admin, actor, "admin_user_action_denied", target, reason, false, {
      actorRole: actor.role,
      targetRole: target.role,
    })
    throw new Error("Permissão insuficiente para gerenciar usuários.")
  }

  if (!canManageTarget(actor, target)) {
    await recordAudit(admin, actor, "admin_user_action_denied", target, reason, false, {
      actorRole: actor.role,
      targetRole: target.role,
    })
    throw new Error("Ação não permitida para este usuário.")
  }

  return { admin, actor, target, reason, request }
}

export async function completeAdminAction(
  context: AdminActionContext,
  event: string,
  metadata: AuditMetadata = {}
) {
  await recordAudit(context.admin, context.actor, event, context.target, context.reason, true, {
    actorRole: context.actor.role,
    targetRole: context.target.role,
    ...metadata,
  })

  return jsonResponse(context.request, { ok: true, id: context.target.id, authUserId: context.target.auth_user_id })
}
