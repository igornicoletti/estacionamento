export const appUserStatusValues = [
  "pending",
  "active",
  "inactive",
  "password_reset",
  "passkey_reset",
] as const

export type AppUserStatus = (typeof appUserStatusValues)[number]

export const appUserStatusLabels: Record<AppUserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  passkey_reset: "Recadastro de passkey",
  password_reset: "Redefinição de senha",
  pending: "Pendente",
}

export const appAccessStatusValues = [
  "active",
] as const satisfies readonly AppUserStatus[]

export const accountRecoveryStatusValues = [
  "password_reset",
  "passkey_reset",
] as const satisfies readonly AppUserStatus[]

export function isAppUserStatus(value: unknown): value is AppUserStatus {
  return (
    typeof value === "string" &&
    appUserStatusValues.includes(value as AppUserStatus)
  )
}

export function canAccessProtectedApp(status: AppUserStatus | null | undefined) {
  return status === "active"
}

export function requiresAccountRecovery(status: AppUserStatus | null | undefined) {
  return status === "password_reset" || status === "passkey_reset"
}
