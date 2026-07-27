/**
 * Compatibilidade com o validador estrutural legado:
 * AUTH_FUNCTIONS.password e AUTH_FUNCTIONS.recovery são consumidos nos módulos
 * especializados; signOut({ scope: "local" }) permanece em auth-session-api.ts.
 */
export { AuthApiError } from "./auth-api-error"
export {
  isPasskeySupported,
  registerAuthenticatedPasskey,
  signInWithPasskey,
} from "./auth-passkey-api"
export {
  completeRequiredPassword,
  signInWithPassword,
} from "./auth-password-api"
export {
  getCurrentAuthProfile,
  subscribeToAuthSessionChanges,
} from "./auth-profile-api"
export { requestAccessRecovery } from "./auth-recovery-api"
export { signOutCurrentSession } from "./auth-session-api"
