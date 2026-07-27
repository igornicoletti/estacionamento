import { normalizeCpf } from "../_shared/index.ts"

export const passwordFlowSeconds = 10 * 60

export type PasswordFlowPurpose = "first_access" | "password_reset"
export type PasswordNextAction = "authenticated" | "set_new_password"

export interface PasswordRequest {
  cpf: string
  flowId: string | null
  newPassword: string | null
  password: string
}

export interface AppUserRow {
  id: string
  auth_user_id: string
  technical_email: string
  name: string
  status: string
  locked_until: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function parsePasswordRequest(value: unknown): PasswordRequest {
  if (!isRecord(value)) {
    throw new Error("Payload inválido.")
  }

  const cpf = normalizeCpf(typeof value.cpf === "string" ? value.cpf : "")
  const password = typeof value.password === "string" ? value.password : ""
  const flowId = typeof value.flowId === "string" ? value.flowId : null
  const newPassword = typeof value.newPassword === "string" ? value.newPassword : null

  if (
    cpf.length !== 11 ||
    password.length < 1 ||
    Boolean(flowId) !== Boolean(newPassword) ||
    (newPassword !== null && newPassword === password)
  ) {
    throw new Error("Credenciais inválidas.")
  }

  return { cpf, flowId, newPassword, password }
}

export function isLocked(lockedUntil: string | null) {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now())
}

export function resolveNextAction(status: string): PasswordNextAction {
  return status === "pending" || status === "password_reset"
    ? "set_new_password"
    : "authenticated"
}
