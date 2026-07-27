import {
  getSupabaseBrowserClient,
  resolveVisibleSensitiveValue,
} from "@/lib"

import {
  AUTH_STATUS,
  normalizeAuthStatus,
  resolveAuthProfilePermissions,
} from "../contracts"
import { authCopy } from "../constants"
import type { AuthProfile, AuthRoleProfile } from "../types"
import { AuthApiError } from "./auth-api-error"
import {
  getRequiredString,
  getString,
  isExternalAvatarUrl,
  isRecord,
  type SupabaseBrowserClient,
  type UnknownRecord,
} from "./auth-api-helpers"

function mapRoleProfile(record: UnknownRecord): AuthRoleProfile | null {
  const key = getString(record.role_key) ?? getString(record.role)

  if (!key) {
    return null
  }

  return {
    id: getString(record.role_id),
    key,
    label: getString(record.role_label),
  }
}

function mapAuthProfile(value: unknown): AuthProfile | null {
  if (!isRecord(value)) {
    return null
  }

  const role = mapRoleProfile(value)
  const avatarReference = getString(value.avatar_url)

  return {
    id: getRequiredString(value, "id"),
    authUserId: getRequiredString(value, "auth_user_id"),
    name: getRequiredString(value, "name"),
    role,
    roleKey: role?.key ?? null,
    status: normalizeAuthStatus(value.status) ?? AUTH_STATUS.inactive,
    permissions: resolveAuthProfilePermissions({
      permissions: value.permissions,
      roleKey: role?.key,
    }),
    unitId: getString(value.unit_id),
    unitName: getString(value.unit_name),
    phoneMasked: resolveVisibleSensitiveValue(getString(value.phone_masked)) ?? "",
    cpfMasked: resolveVisibleSensitiveValue(getString(value.cpf_masked)),
    email: getString(value.email),
    avatarPath:
      avatarReference && !isExternalAvatarUrl(avatarReference)
        ? avatarReference
        : null,
    avatarUrl: avatarReference,
    passkeyStatus: value.passkey_status === "active" ? "active" : "inactive",
  }
}

async function resolveProfileAvatarUrl(
  supabase: SupabaseBrowserClient,
  avatarReference: string | null
) {
  if (!avatarReference || isExternalAvatarUrl(avatarReference)) {
    return avatarReference
  }

  const signedUrlResponse = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarReference, 60 * 60)

  return signedUrlResponse.error ? null : signedUrlResponse.data?.signedUrl ?? null
}

export function subscribeToAuthSessionChanges(callback: () => void) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return () => undefined
  }

  const authStateChangeResponse = supabase.auth.onAuthStateChange(() => {
    callback()
  })

  return () => authStateChangeResponse.data.subscription.unsubscribe()
}

export async function getCurrentAuthProfile() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return null
  }

  const userResponse = await supabase.auth.getUser()
  const user = userResponse.data.user

  if (userResponse.error || !user) {
    return null
  }

  const profileResponse = await supabase.rpc("get_current_auth_profile")

  if (profileResponse.error) {
    throw new AuthApiError(authCopy.errors.sessionLoadFailed)
  }

  const profile = Array.isArray(profileResponse.data)
    ? mapAuthProfile(profileResponse.data[0])
    : mapAuthProfile(profileResponse.data)

  if (!profile) {
    return null
  }

  return {
    ...profile,
    avatarUrl: await resolveProfileAvatarUrl(supabase, profile.avatarUrl),
  }
}
