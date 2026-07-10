export const AUTH_STATUS = {
  active: "active",
  pending: "pending",
  inactive: "inactive",
  passwordReset: "password_reset",
  passkeyReset: "passkey_reset",
} as const

export const AUTH_NEXT_ACTION = {
  authenticated: "authenticated",
  setNewPassword: "set_new_password",
  registerPasskey: "register_passkey",
  usePasskey: "use_passkey",
} as const

export const AUTH_FUNCTIONS = {
  password: "auth-password",
  recovery: "auth-recovery-request",
} as const

export const AUTH_STORAGE_KEYS = {
  inactivityExpired: "rmc.auth.inactivity-expired",
} as const

export const AUTH_INACTIVITY = {
  timeoutMs: 15 * 60 * 1000,
  warningMs: 60 * 1000,
  tickMs: 1000,
} as const

export const AUTH_PERMISSION_WILDCARD = "*"

export const AUTH_PERMISSION = {
  all: AUTH_PERMISSION_WILDCARD,
  profileReadSelf: "profile.read_self",
  settingsReadSelf: "settings.read_self",
  notificationsRead: "notifications.read",
  unitsRead: "units.read",
  clientsRead: "clients.read",
  clientVehiclesRead: "client_vehicles.read",
  pricesRead: "prices.read",
  rulesRead: "rules.read",
  usersRead: "users.read",
  usersManage: "users.manage",
  accessRequestsRead: "access_requests.read",
  accessRequestsReview: "access_requests.review",
  permissionsRead: "permissions.read",
  auditRead: "audit.read",
} as const

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS] | string
export type AuthNextAction = (typeof AUTH_NEXT_ACTION)[keyof typeof AUTH_NEXT_ACTION]
export type AuthPermission = string

export function isAuthPermission(value: unknown): value is AuthPermission {
  return typeof value === "string" && value.trim().length > 0
}

export function normalizeAuthPermission(value: unknown): AuthPermission | null {
  return isAuthPermission(value) ? value.trim() : null
}

export function normalizeAuthPermissions(value: unknown): readonly AuthPermission[] {
  if (!Array.isArray(value)) {
    return []
  }

  const permissions = new Set<AuthPermission>()

  for (const item of value) {
    const permission = normalizeAuthPermission(item)

    if (permission) {
      permissions.add(permission)
    }
  }

  return Array.from(permissions)
}

export function canAccessProtectedApp(status: AuthStatus | null | undefined) {
  return status === AUTH_STATUS.active
}

export function requiresAccountRecovery(status: AuthStatus | null | undefined) {
  return status === AUTH_STATUS.passwordReset || status === AUTH_STATUS.passkeyReset
}
