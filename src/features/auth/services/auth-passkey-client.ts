import { shouldBypassAuthInDev } from "@/config"
import { getSupabaseBrowserClient } from "@/lib"

import { createAuthPublicError } from "./auth-error"

type SupabasePasskeyClient = {
  passkey?: {
    signInWithPasskey?: () => Promise<{ error: unknown }>
    registerPasskey?: () => Promise<{ error: unknown }>
  }
  signInWithPasskey?: () => Promise<{ error: unknown }>
  registerPasskey?: () => Promise<{ error: unknown }>
}

function getPasskeyClient() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    if (shouldBypassAuthInDev()) {
      return null
    }

    throw createAuthPublicError(
      "AUTH_SUPABASE_NOT_CONFIGURED",
      "getPasskeyClient"
    )
  }

  return supabase.auth as SupabasePasskeyClient
}

async function invokePasskeyMethod(
  methodName: "signInWithPasskey" | "registerPasskey"
) {
  const auth = getPasskeyClient()

  if (!auth) {
    return
  }

  const method = auth.passkey?.[methodName] ?? auth[methodName]

  if (!method) {
    throw createAuthPublicError(
      "AUTH_PASSKEY",
      `invokePasskeyMethod:${methodName}:missing-method`
    )
  }

  let result: { error: unknown }

  try {
    result = await method()
  } catch (caughtError) {
    throw createAuthPublicError(
      "AUTH_PASSKEY",
      `invokePasskeyMethod:${methodName}:invoke-failed`,
      caughtError
    )
  }

  if (result.error) {
    throw createAuthPublicError(
      "AUTH_PASSKEY",
      `invokePasskeyMethod:${methodName}:provider-error`,
      result.error
    )
  }
}

export async function signInWithPasskey() {
  await invokePasskeyMethod("signInWithPasskey")
}

export async function registerPasskey() {
  await invokePasskeyMethod("registerPasskey")
}
