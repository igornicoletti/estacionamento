import { shouldBypassAuthInDev } from "@/config"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { createAuthPublicError } from "./auth-error"

function isPasskeyDisabledProviderError(caughtError: unknown) {
  if (!caughtError || typeof caughtError !== "object") {
    return false
  }

  const message =
    "message" in caughtError && typeof caughtError.message === "string"
      ? caughtError.message
      : ""

  return message.toLowerCase().includes("passkeys are disabled")
}

function getPasskeyAuthClient() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    if (shouldBypassAuthInDev()) {
      return null
    }

    throw createAuthPublicError(
      "AUTH_SUPABASE_NOT_CONFIGURED",
      "getPasskeyAuthClient"
    )
  }

  return supabase.auth
}

async function invokePasskeyMethod(
  methodName: "signInWithPasskey" | "registerPasskey"
) {
  const auth = getPasskeyAuthClient()

  if (!auth) {
    return
  }

  // Supabase JS v2.108+ exposes passkey methods directly on auth:
  // auth.signInWithPasskey() / auth.registerPasskey()
  const method = (auth as unknown as Record<string, unknown>)[methodName]

  if (typeof method !== "function") {
    throw createAuthPublicError(
      "AUTH_PASSKEY",
      `invokePasskeyMethod:${methodName}:missing-method`
    )
  }

  let result: { error: unknown }

  try {
    result = await (method as () => Promise<{ error: unknown }>).call(auth)
  } catch (caughtError) {
    throw createAuthPublicError(
      "AUTH_PASSKEY",
      `invokePasskeyMethod:${methodName}:invoke-failed`,
      caughtError
    )
  }

  if (result.error) {
    if (isPasskeyDisabledProviderError(result.error)) {
      throw createAuthPublicError(
        "AUTH_PASSKEY_DISABLED",
        `invokePasskeyMethod:${methodName}:provider-disabled`,
        result.error
      )
    }

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
