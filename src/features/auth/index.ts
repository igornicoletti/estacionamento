export {
  completeRequiredPassword,
  getCurrentAuthProfile,
  requestAccessRecovery,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
} from "./api/auth-api"

export type {
  AppUserProfile,
  AuthFlowActionResponse,
  AuthFlowStep,
  AuthPasswordNextAction,
  AuthPasswordResponse,
  AuthProfile,
  AuthRoleProfile,
  AuthSessionPayload,
  AuthStartResponse,
  ProfileActionResponse,
  RecoveryRequestResponse,
} from "./types/auth-types"

export {
  AUTH_FUNCTIONS,
  AUTH_INACTIVITY,
  AUTH_NEXT_ACTION,
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_ROLE_KEY,
  AUTH_STATUS,
  AUTH_STORAGE_KEYS,
  canAccessProtectedApp,
  getRoleFallbackPermissions,
  isAuthPermission,
  isAuthStatus,
  normalizeAuthPermission,
  normalizeAuthPermissions,
  normalizeAuthStatus,
  requiresAccountRecovery,
  resolveAuthProfilePermissions,
  type AuthNextAction,
  type AuthPermission,
  type AuthRoleKey,
  type AuthStatus,
} from "./contracts/auth-contracts"

export { authCopy } from "./copy/auth-copy"

export {
  AuthProvider,
  consumeAuthInactivitySessionExpired,
  markAuthInactivitySessionExpired,
  useAuth,
  useAuthSession,
  type AuthAccessState,
  type AuthActions,
  type AuthContextValue,
  type AuthInactivityState,
  type AuthSessionStatus,
  type AuthSessionValue,
  type RequiredPasswordChallenge,
} from "./context/auth-provider"

export { AuthPageCard } from "./components/auth-page-card"

export {
  authCpfSchema,
  authLoginSchema,
  authPasswordSchema,
  authRecoverySchema,
  formatCpfInput,
  formatPhoneInput,
  getFirstIssueByPath,
  newPasswordSchema,
  normalizeCpf,
  normalizePhone,
  recoveryReasonValues,
  requiredPasswordSchema,
  type AuthLoginPayload,
  type AuthRecoveryFormValues,
  type AuthRecoveryPayload,
  type FieldErrors,
  type RecoveryReason,
  type RequiredPasswordValues,
} from "./validation/auth-validation"
