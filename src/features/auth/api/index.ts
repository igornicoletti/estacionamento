export {
  AuthApiError,
  completeRequiredPassword,
  getCurrentAuthProfile,
  isPasskeySupported,
  registerAuthenticatedPasskey,
  registerCurrentPasskey,
  requestAccessRecovery,
  signInWithPasskey,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
} from "./auth-api"

export type {
  AuthPasskeyRegistrationResult,
  AuthProfile,
} from "../types/auth-types"
