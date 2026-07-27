import { getValidatedSupabaseAccessToken } from "@/lib"

import { AUTH_FUNCTIONS } from "../contracts"
import { authCopy } from "../constants"
import { AuthApiError } from "./auth-api-error"
import {
  getSupabaseOrThrow,
  mapPasskeyRegistrationResult,
} from "./auth-api-helpers"

export function isPasskeySupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  )
}

export async function signInWithPasskey() {
  if (!isPasskeySupported()) {
    throw new AuthApiError(authCopy.errors.passkeyNotSupported)
  }

  const supabase = getSupabaseOrThrow()
  const response = await supabase.auth.signInWithPasskey()

  if (response.error) {
    throw new AuthApiError(authCopy.errors.passkeyLoginFailed)
  }

  const accessToken =
    response.data.session?.access_token ??
    (await getValidatedSupabaseAccessToken(supabase))

  if (!accessToken) {
    return
  }

  await supabase.functions.invoke(AUTH_FUNCTIONS.passkeyLogin, {
    body: {},
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function registerAuthenticatedPasskey() {
  if (!isPasskeySupported()) {
    throw new AuthApiError(authCopy.errors.passkeyNotSupported)
  }

  const supabase = getSupabaseOrThrow()
  const response = await supabase.auth.registerPasskey()

  if (response.error) {
    throw new AuthApiError(authCopy.errors.passkeyRegistrationFailed)
  }

  return mapPasskeyRegistrationResult(response.data)
}
