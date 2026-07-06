import { shouldBypassAuthInDev } from "@/config"
import { getSupabaseBrowserClient } from "@/lib"

import { type UserRecord } from "@/features/users/types/users-types"
import {
  isAppUserStatus,
  isUserRole,
} from "../authorization"
import { type AppUserProfile } from "../types"

type UnknownRecord = Record<PropertyKey, unknown>
type ProfileSyncListener = () => void
type UnitLinkRecord = {
  unit_id?: unknown
}

const profileSyncListeners = new Set<ProfileSyncListener>()

function notifyProfileSyncListeners() {
  for (const listener of profileSyncListeners) {
    listener()
  }
}

export function subscribeToProfileSyncChanges(listener: ProfileSyncListener) {
  profileSyncListeners.add(listener)

  return () => {
    profileSyncListeners.delete(listener)
  }
}

const developmentProfile: AppUserProfile = {
  authUserId: "dev-auth-user",
  avatarUrl: null,
  email: "igor.nicoletti@redemontecarlo.com",
  id: "USR-001",
  mfaStatus: "inactive",
  name: "Igor Nicoletti",
  phoneMasked: "(17) 99130-4197",
  role: "owner",
  status: "active",
  unitId: null,
  unitName: null,
}



function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function getDevelopmentProfile() {
  return shouldBypassAuthInDev() ? developmentProfile : null
}

export function syncDevelopmentSessionProfileFromUser(user: UserRecord) {
  if (!import.meta.env.DEV || !shouldBypassAuthInDev()) {
    return
  }

  if (developmentProfile.id !== user.id) {
    return
  }

  Object.assign(developmentProfile, {
    name: user.name,
    role: developmentProfile.role,
    status: user.status,
    email: user.email,
    phoneMasked: user.phoneMasked || developmentProfile.phoneMasked,
    unitId: user.unitId,
    unitName: user.unitName,
    mfaStatus: user.mfaStatus,
  } satisfies Partial<AppUserProfile>)

  notifyProfileSyncListeners()
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : null
}

function getFirstUnitIdFromRelation(value: unknown) {
  if (Array.isArray(value) && value.length > 0) {
    const firstValue = value[0] as UnitLinkRecord
    return getStringValue(firstValue?.unit_id)
  }

  if (isRecord(value)) {
    return getStringValue((value as UnitLinkRecord).unit_id)
  }

  return null
}

function resolveMfaStatus(data: UnknownRecord): "active" | "inactive" {
  const hasVerifiedContact =
    Boolean(getStringValue(data.phone_verified_at)) ||
    Boolean(getStringValue(data.email_verified_at))

  return hasVerifiedContact ? "active" : "inactive"
}

function mapAppUserProfile(data: unknown): AppUserProfile | null {
  if (!isRecord(data)) {
    return null
  }

  if (!isUserRole(data.role) || !isAppUserStatus(data.status)) {
    return null
  }

  const id = getStringValue(data.id)
  const authUserId = getStringValue(data.auth_user_id)
  const name = getStringValue(data.name)
  const phoneMasked = getStringValue(data.phone_masked)

  if (!id || !authUserId || !name || !phoneMasked) {
    return null
  }

  return {
    id,
    authUserId,
    avatarUrl: null,
    name,
    role: data.role,
    status: data.status,
    unitId: getFirstUnitIdFromRelation(data.app_user_units),
    unitName: null,
    phoneMasked,
    email: getStringValue(data.email),
    mfaStatus: resolveMfaStatus(data),
  }
}

export async function getCurrentSessionProfile(): Promise<AppUserProfile | null> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return getDevelopmentProfile()
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return getDevelopmentProfile()
  }

  const { data, error } = await supabase
    .from("app_users")
    .select(
      "id, auth_user_id, name, role, status, phone_masked, email, phone_verified_at, email_verified_at, app_user_units(unit_id)"
    )
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error) {
    return getDevelopmentProfile()
  }

  return mapAppUserProfile(data) ?? getDevelopmentProfile()
}

export async function signOutCurrentSession() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

export function subscribeToAuthSessionChanges(callback: () => void) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return () => { }
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    callback()
  })

  return () => {
    subscription.unsubscribe()
  }
}
