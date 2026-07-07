import { shouldBypassAuthInDev } from "@/config"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { type UserRecord } from "@/features/users/types/users-types"
import {
  isAppUserStatus,
  isUserRole,
} from "../authorization"
import { type AppUserProfile } from "../types"
import { reportAuthInternalError } from "./auth-error"

type UnknownRecord = Record<PropertyKey, unknown>
type ProfileSyncListener = () => void
type UnitLinkRecord = {
  unit_id?: unknown
}

function shouldUseDevelopmentProfile() {
  return shouldBypassAuthInDev()
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
  cpfMasked: "***.***.***-00",
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
  return shouldUseDevelopmentProfile() ? developmentProfile : null
}

export function syncDevelopmentSessionProfileFromUser(user: UserRecord) {
  if (!shouldUseDevelopmentProfile()) {
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
    cpfMasked: user.cpf || developmentProfile.cpfMasked,
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

function resolveDisplayValue(
  data: UnknownRecord,
  displayKey: string,
  maskedKey: string
) {
  return getStringValue(data[displayKey]) ?? getStringValue(data[maskedKey])
}

function mapAppUserProfile(data: unknown): AppUserProfile | null {
  if (!isRecord(data)) {
    reportAuthInternalError("mapAppUserProfile:not-record", data)
    return null
  }

  if (!isUserRole(data.role) || !isAppUserStatus(data.status)) {
    reportAuthInternalError("mapAppUserProfile:invalid-role-or-status", {
      role: data.role,
      status: data.status,
    })
    return null
  }

  const id = getStringValue(data.id)
  const authUserId = getStringValue(data.auth_user_id)
  const name = getStringValue(data.name)
  const phoneMasked = resolveDisplayValue(data, "phone_display", "phone_masked")

  if (!id || !authUserId || !name || !phoneMasked) {
    reportAuthInternalError("mapAppUserProfile:missing-required-fields", {
      hasId: Boolean(id),
      hasAuthUserId: Boolean(authUserId),
      hasName: Boolean(name),
      hasPhoneMasked: Boolean(phoneMasked),
    })
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
    cpfMasked: resolveDisplayValue(data, "cpf_display", "cpf_masked"),
    email: getStringValue(data.email),
    mfaStatus: resolveMfaStatus(data),
  }
}

export async function getCurrentSessionProfile(): Promise<AppUserProfile | null> {
  if (shouldBypassAuthInDev()) {
    return getDevelopmentProfile()
  }

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
      "id, auth_user_id, name, role, status, phone_display, phone_masked, cpf_display, cpf_masked, email, phone_verified_at, email_verified_at"
    )
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error) {
    reportAuthInternalError("getCurrentSessionProfile:app_users", error)
    return getDevelopmentProfile()
  }

  if (!data) {
    return getDevelopmentProfile()
  }

  // Fetch unit link separately to avoid PostgREST embedded resource 500
  const { data: unitLink } = await supabase
    .from("app_user_units")
    .select("unit_id")
    .eq("app_user_id", data.id)
    .maybeSingle()

  const profileData = {
    ...data,
    app_user_units: unitLink ?? null,
  }

  return mapAppUserProfile(profileData) ?? getDevelopmentProfile()
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
