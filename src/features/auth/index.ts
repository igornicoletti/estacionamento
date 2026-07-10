export {
  AUTH_FUNCTIONS,
  AUTH_INACTIVITY,
  AUTH_NEXT_ACTION,
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_STATUS,
  AUTH_STORAGE_KEYS,
  canAccessProtectedApp,
  isAuthPermission,
  normalizeAuthPermission,
  normalizeAuthPermissions,
  requiresAccountRecovery,
  type AuthNextAction,
  type AuthPermission,
  type AuthStatus,
} from "./auth-contracts"

export { authCopy } from "./auth-copy"

export {
  authCpfSchema,
  authLoginSchema,
  authPasswordSchema,
  authRecoverySchema,
  getFirstIssueByPath,
  newPasswordSchema,
  normalizeCpf,
  recoveryReasonValues,
  requiredPasswordSchema,
  type AuthLoginPayload,
  type AuthRecoveryPayload,
  type FieldErrors,
  type RecoveryReason,
  type RequiredPasswordValues,
} from "./auth-validation"

export {
  AuthProvider,
  consumeAuthInactivitySessionExpired,
  markAuthInactivitySessionExpired,
  useAuth,
  useAuthSession,
} from "./auth-provider"

export type { AuthProfile, AuthRoleProfile } from "./auth-api"
