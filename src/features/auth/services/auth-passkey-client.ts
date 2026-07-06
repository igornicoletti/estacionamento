import { shouldBypassAuthInDev } from "@/config"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

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

  // Supabase SDK passkey API migration path:
  // v2.x stable: auth.passkey.signInWithPasskey / auth.passkey.registerPasskey
  // v2.x experimental: auth.experimental.signInWithPasskey / auth.experimental.registerPasskey
  // v1.x legacy: auth.signInWithPasskey / auth.registerPasskey
  // This fallback chain ensures compatibility across SDK versions.
  const passkey = auth.passkey ?? (auth as Record<string, unknown>).experimental as SupabasePasskeyClient["passkey"]
  const method = passkey?.[methodName] ?? auth[methodName]

  if (!method) {
    throw createAuthPublicError(
      "AUTH_PASSKEY",
      `invokePasskeyMethod:${methodName}:missing-method`
    )
  }

  let result: { error: unknown }

  try {
    result = await method.call(passkey ?? auth)
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
