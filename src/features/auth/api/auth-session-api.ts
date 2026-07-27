import { authCopy } from "../constants"
import { AuthApiError } from "./auth-api-error"
import { getSupabaseOrThrow } from "./auth-api-helpers"

export async function signOutCurrentSession() {
  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.auth.signOut({ scope: "local" })

  if (error) {
    throw new AuthApiError(authCopy.errors.logoutFailed)
  }
}
