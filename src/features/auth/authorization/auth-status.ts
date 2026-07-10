export type AppUserStatus = string

export const authUserStatus = {
  active: "active",
  passwordReset: "password_reset",
  passkeyReset: "passkey_reset",
} as const

export function isAppUserStatus(value: unknown): value is AppUserStatus {
  return typeof value === "string" && value.trim().length > 0
}

export function canAccessProtectedApp(status: AppUserStatus | null | undefined) {
  return status === authUserStatus.active
}

export function requiresAccountRecovery(status: AppUserStatus | null | undefined) {
  return (
    status === authUserStatus.passwordReset ||
    status === authUserStatus.passkeyReset
  )
}
