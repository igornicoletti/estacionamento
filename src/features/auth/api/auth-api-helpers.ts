import { getSupabaseBrowserClient } from "@/lib"

import { authCopy } from "../constants"
import type {
  AuthPasskeyRegistrationResult,
  AuthSessionPayload,
} from "../types"
import { AuthApiError } from "./auth-api-error"

export type UnknownRecord = Record<PropertyKey, unknown>
export type SupabaseBrowserClient = NonNullable<
  ReturnType<typeof getSupabaseBrowserClient>
>

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

export function getString(value: unknown) {
  return typeof value === "string" ? value : null
}

export function getRequiredString(record: UnknownRecord, key: PropertyKey) {
  const value = getString(record[key])

  if (!value) {
    throw new AuthApiError(authCopy.errors.sessionLoadFailed)
  }

  return value
}

export function isExternalAvatarUrl(value: string) {
  return /^(https?:|data:image\/)/i.test(value)
}

export function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new AuthApiError(authCopy.errors.unavailable)
  }

  return supabase
}

export async function setSessionIfPresent(session: AuthSessionPayload | undefined) {
  if (!session) {
    return
  }

  const supabase = getSupabaseOrThrow()
  const sessionResponse = await supabase.auth.setSession(session)

  if (sessionResponse.error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }
}

export function mapPasskeyRegistrationResult(
  value: unknown
): AuthPasskeyRegistrationResult {
  if (!isRecord(value)) {
    return {
      createdAt: null,
      friendlyName: null,
      id: "",
    }
  }

  return {
    createdAt: getString(value.created_at),
    friendlyName: getString(value.friendly_name),
    id: getString(value.id) ?? "",
  }
}
