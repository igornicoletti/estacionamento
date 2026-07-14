export {
  AuthApiError,
  completeRequiredPassword,
  getCurrentAuthProfile,
  isPasskeySupported,
  registerCurrentPasskey,
  requestAccessRecovery,
  signInWithPasskey,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
} from "./auth-api"

export type { AuthProfile } from "../types/auth-types"
