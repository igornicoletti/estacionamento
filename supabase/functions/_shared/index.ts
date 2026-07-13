import {
  createAdminClient,
  createAuthorizedClient,
  createPasswordAuthClient,
  type Json,
} from "./auth-supabase-admin.ts"
import { getCorsHeaders, handleCors } from "./auth-cors.ts"

export {
  createAdminClient,
  createAuthorizedClient,
  createPasswordAuthClient,
  getCorsHeaders,
  handleCors,
}

type AppUserRole = "owner" | "admin" | "auditor" | "manager" | "operator"
type RecoveryReason = "lost_phone" | "forgot_password" | "attempts_blocked" | "other"
type AuditMetadata = { [key: string]: Json | undefined }

interface AdminCreateUserInput {
  cpf: string
  email?: string | null
  name: string
  phone: string
  role: AppUserRole
  temporaryPassword: string
  unitId?: string | null
}

interface AdminUpdateUserInput {
  cpf: string
  email?: string | null
  name: string
  phone: string
  role: AppUserRole
  targetUserId: string
  unitId?: string | null
}

export interface AuthenticatedActor {
  id: string
  authUserId: string
  name: string
  role: AppUserRole
  status: string
}

interface AuditEventInput {
  actor: string
  actorUserId?: string | null
  event: string
  metadata?: AuditMetadata
  reason?: string | null
  request?: Request
  scope: "login" | "system"
  severity?: "info" | "warning" | "critical"
  success: boolean
  target: string
  targetUserId?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === "string" ? value.trim() : ""
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = readString(record, key)
  return value || null
}

function isRole(value: string): value is AppUserRole {
  return (
    value === "owner" ||
    value === "admin" ||
    value === "auditor" ||
    value === "manager" ||
    value === "operator"
  )
}

function isRecoveryReason(value: string): value is RecoveryReason {
  return (
    value === "lost_phone" ||
    value === "forgot_password" ||
    value === "attempts_blocked" ||
    value === "other"
  )
}

function parseRequiredRecord(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Payload inválido.")
  }

  return value
}

function parseRole(value: string) {
  if (!isRole(value)) {
    throw new Error("Perfil inválido.")
  }

  return value
}

function ensureMinLength(value: string, minLength: number, message: string) {
  if (value.trim().length < minLength) {
    throw new Error(message)
  }

  return value.trim()
}

export const adminCreateUserSchema = {
  parse(value: unknown): AdminCreateUserInput {
    const record = parseRequiredRecord(value)
    const input = {
      cpf: normalizeCpf(readString(record, "cpf")),
      email: readOptionalString(record, "email"),
      name: ensureMinLength(readString(record, "name"), 3, "Nome inválido."),
      phone: normalizePhone(readString(record, "phone")),
      role: parseRole(readString(record, "role")),
      temporaryPassword: readString(record, "temporaryPassword"),
      unitId: readOptionalString(record, "unitId"),
    }

    if (input.cpf.length !== 11 || input.phone.length < 10) {
      throw new Error("Dados inválidos.")
    }

    if (input.temporaryPassword.length < 12) {
      throw new Error("Senha temporária fraca.")
    }

    return input
  },
}

export const adminUpdateUserSchema = {
  parse(value: unknown): AdminUpdateUserInput {
    const record = parseRequiredRecord(value)
    const input = {
      cpf: normalizeCpf(readString(record, "cpf")),
      email: readOptionalString(record, "email"),
      name: ensureMinLength(readString(record, "name"), 3, "Nome inválido."),
      phone: normalizePhone(readString(record, "phone")),
      role: parseRole(readString(record, "role")),
      targetUserId: readString(record, "targetUserId"),
      unitId: readOptionalString(record, "unitId"),
    }

    if (input.cpf.length !== 11 || input.phone.length < 10 || !input.targetUserId) {
      throw new Error("Dados inválidos.")
    }

    return input
  },
}

export const recoveryRequestSchema = {
  parse(value: unknown) {
    const record = parseRequiredRecord(value)
    const reason = readString(record, "reason")

    if (!isRecoveryReason(reason)) {
      throw new Error("Motivo inválido.")
    }

    const input = {
      cpf: normalizeCpf(readString(record, "cpf")),
      description: readString(record, "description").slice(0, 500),
      email: readOptionalString(record, "email"),
      phone: normalizePhone(readString(record, "phone")),
      reason,
    }

    if (input.cpf.length !== 11 || input.phone.length < 10) {
      throw new Error("Dados inválidos.")
    }

    return input
  },
}

export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  request?: Request
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(request ? getCorsHeaders(request) : {}),
      "Content-Type": "application/json",
    },
  })
}

export function genericAuthError(status = 400, request?: Request) {
  return jsonResponse(
    {
      ok: false,
      code: "request_failed",
      message: "Não foi possível concluir a solicitação.",
    },
    status,
    request
  )
}

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

export function formatCpf(value: string) {
  const cpf = normalizeCpf(value)
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

export function formatPhone(value: string) {
  const phone = normalizePhone(value)

  if (phone.length <= 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`
  }

  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
}

export function maskCpf(value: string) {
  const cpf = normalizeCpf(value)
  return cpf.length === 11 ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : "***"
}

export function maskPhone(value: string) {
  const phone = normalizePhone(value)
  return phone.length >= 10
    ? `(**) *****-${phone.slice(-4)}`
    : "***"
}

function getHashSecret() {
  const secret = Deno.env.get("APP_HMAC_SECRET") ?? Deno.env.get("CPF_HMAC_SECRET")

  if (!secret) {
    throw new Error("Missing APP_HMAC_SECRET.")
  }

  return secret
}

export async function hashSensitiveValue(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getHashSecret()),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  )

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function getRequestHash(request: Request, header: string) {
  const value = request.headers.get(header)
  return value ? await hashSensitiveValue(value) : null
}

export async function getAuthenticatedActor(
  request: Request
): Promise<AuthenticatedActor | null> {
  const authorization = request.headers.get("Authorization") ??
    request.headers.get("authorization")

  if (!authorization) {
    return null
  }

  const userClient = createAuthorizedClient(authorization)
  const userResponse = await userClient.auth.getUser()

  if (userResponse.error || !userResponse.data.user) {
    return null
  }

  const admin = createAdminClient()
  const response = await admin
    .from("app_users")
    .select("id, auth_user_id, name, role, status")
    .eq("auth_user_id", userResponse.data.user.id)
    .maybeSingle()

  if (response.error || !response.data || !isRole(response.data.role)) {
    return null
  }

  return {
    authUserId: response.data.auth_user_id,
    id: response.data.id,
    name: response.data.name,
    role: response.data.role,
    status: response.data.status,
  }
}

export function requireAdminActor(actor: AuthenticatedActor | null) {
  if (
    !actor ||
    actor.status !== "active" ||
    (actor.role !== "owner" && actor.role !== "admin")
  ) {
    throw new Error("Permissão insuficiente.")
  }

  return actor
}

export async function writeAuditEvent(input: AuditEventInput) {
  const admin = createAdminClient()
  const request = input.request

  await admin.from("audit_events").insert({
    actor: input.actor,
    actor_user_id: input.actorUserId ?? null,
    event: input.event,
    ip_hash: request ? await getRequestHash(request, "x-forwarded-for") : null,
    metadata: input.metadata ?? {},
    reason: input.reason ?? null,
    scope: input.scope,
    severity: input.severity ?? (input.success ? "info" : "warning"),
    success: input.success,
    target: input.target,
    target_user_id: input.targetUserId ?? null,
    user_agent_hash: request ? await getRequestHash(request, "user-agent") : null,
  })
}
