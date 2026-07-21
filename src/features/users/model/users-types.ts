import {
  AUTH_ROLE_KEY,
  AUTH_STATUS,
  type AuthRoleKey,
  type AuthStatus,
} from "@/features/auth"

export type UserRole = AuthRoleKey
export type AppUserStatus = AuthStatus

export const userRoleValues = [
  AUTH_ROLE_KEY.owner,
  AUTH_ROLE_KEY.admin,
  AUTH_ROLE_KEY.auditor,
  AUTH_ROLE_KEY.manager,
  AUTH_ROLE_KEY.operator,
] as const satisfies readonly UserRole[]

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  auditor: "Auditor",
  manager: "Gestor",
  operator: "Operador",
  owner: "Proprietário",
}

export const appUserStatusLabels: Record<AppUserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  passkey_reset: "Reset de passkey",
  password_reset: "Troca de senha",
  pending: "Pendente",
}

export function isUserRole(value: unknown): value is UserRole {
  return userRoleValues.includes(value as UserRole)
}

export function isGlobalRole(value: unknown) {
  return (
    value === AUTH_ROLE_KEY.owner ||
    value === AUTH_ROLE_KEY.admin ||
    value === AUTH_ROLE_KEY.auditor
  )
}

export function requiresSingleUnit(value: unknown) {
  return isUserRole(value) && !isGlobalRole(value)
}

export function isAppUserStatus(value: unknown): value is AppUserStatus {
  return (
    value === AUTH_STATUS.active ||
    value === AUTH_STATUS.pending ||
    value === AUTH_STATUS.inactive ||
    value === AUTH_STATUS.passwordReset ||
    value === AUTH_STATUS.passkeyReset
  )
}

export interface UserRecord {
  id: string
  authUserId?: string
  name: string
  cpf: string
  email: string | null
  phoneMasked: string | null
  role: UserRole
  status: AppUserStatus
  lockedUntil?: string | null
  unitId: string | null
  unitName: string | null
  passkeyStatus: "active" | "inactive"
  passkeyCount?: number
  lastAccessAt: string | null
}

export interface CreateUserInput {
  name: string
  cpf: string
  email?: string
  phone?: string
  role: UserRole
  unitId?: string
  unitName?: string
  firstAccessPassword: string
}

export interface UpdateUserInput extends Omit<CreateUserInput, "firstAccessPassword"> {
  id: string
  firstAccessPassword?: string
}

export interface UnitCatalogItem {
  id: string
  name: string
}
