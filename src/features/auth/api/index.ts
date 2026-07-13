export {
  AuthApiError,
  completeRequiredPassword,
  getCurrentAuthProfile,
  requestAccessRecovery,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
} from "./auth-api"

export type { AuthProfile } from "../types/auth-types"
