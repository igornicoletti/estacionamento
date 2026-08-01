import {
  AUTH_STATUS,
  appUserStatusLabels,
  isGlobalRole,
  isUserRole,
  requiresSingleUnit,
  userRoleLabels,
  userRoleValues,
  type AppUserStatus as AuthAppUserStatus,
  type UserRole as AuthUserRole,
} from "@/features/auth"

export type UserRole = AuthUserRole
export type AppUserStatus = AuthAppUserStatus

export {
  appUserStatusLabels,
  isGlobalRole,
  isUserRole,
  requiresSingleUnit,
  userRoleLabels,
  userRoleValues,
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
  firstAccessPassword: string
}

export interface UpdateUserInput
  extends Omit<CreateUserInput, "firstAccessPassword"> {
  id: string
}

export interface UnitCatalogItem {
  id: string
  name: string
}

export type UserAdminActionKind =
  | "block"
  | "clear-lock"
  | "reset-passkey"
  | "reset-password"
  | "revoke-sessions"

export interface UserAdminAction {
  kind: UserAdminActionKind
  user: UserRecord
}
