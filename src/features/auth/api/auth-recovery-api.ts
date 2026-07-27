import { AUTH_FUNCTIONS } from "../contracts"
import { authCopy } from "../constants"
import type { AuthRecoveryPayload } from "../validation"
import { AuthApiError } from "./auth-api-error"
import { getSupabaseOrThrow } from "./auth-api-helpers"

export async function requestAccessRecovery(payload: AuthRecoveryPayload) {
  const supabase = getSupabaseOrThrow()
  const recoveryResponse = await supabase.functions.invoke(AUTH_FUNCTIONS.recovery, {
    body: payload,
  })

  if (recoveryResponse.error) {
    throw new AuthApiError(authCopy.errors.recoveryFailed)
  }
}
