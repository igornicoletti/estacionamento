import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  AUTH_FUNCTIONS,
  AUTH_NEXT_ACTION,
  normalizeAuthPermissions,
  type AuthNextAction,
  type AuthPermission,
  type AuthStatus,
} from "./auth-contracts"
import { authCopy } from "./auth-copy"
import type { AuthLoginPayload, AuthRecoveryPayload } from "./auth-validation"

export interface AuthRoleProfile {
  id: string | null
  key: string | null
  label: string | null
}

export interface AuthProfile {
  id: string
  authUserId: string
  name: string
  role: AuthRoleProfile | null
  roleKey: string | null
  status: AuthStatus
  permissions: readonly AuthPermission[]
  unitId: string | null
  unitName: string | null
  phoneMasked: string
  cpfMasked: string | null
  email: string | null
  avatarUrl: string | null
  passkeyStatus: "active" | "inactive"
}

export interface AuthSessionPayload {
  access_token: string
  refresh_token: string
}

export interface AuthPasswordResponse {
  flowId: string | null
  message: string
  nextAction: AuthNextAction
  session?: AuthSessionPayload
}

type UnknownRecord = Record<PropertyKey, unknown>

export class AuthApiError extends Error {
  constructor(message: string = authCopy.errors.unavailable) {
    super(message)
    this.name = "AuthApiError"
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null
}

function getRequiredString(record: UnknownRecord, key: PropertyKey) {
  const value = getString(record[key])

  if (!value) {
    throw new AuthApiError(authCopy.errors.sessionLoadFailed)
  }

  return value
}

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

  return {
    id: getRequiredString(value, "id"),
    authUserId: getRequiredString(value, "auth_user_id"),
    name: getRequiredString(value, "name"),
    role,
    roleKey: role?.key ?? null,
    status: getRequiredString(value, "status"),
    permissions: normalizeAuthPermissions(value.permissions),
    unitId: getString(value.unit_id),
    unitName: getString(value.unit_name),
    phoneMasked: getRequiredString(value, "phone_masked"),
    cpfMasked: getString(value.cpf_masked),
    email: getString(value.email),
    avatarUrl: getString(value.avatar_url),
    passkeyStatus: value.passkey_status === "active" ? "active" : "inactive",
  }
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new AuthApiError(authCopy.errors.unavailable)
  }

  return supabase
}

async function setSessionIfPresent(session: AuthSessionPayload | undefined) {
  if (!session) {
    return
  }

  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.auth.setSession(session)

  if (error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }
}

function mapPasswordResponse(value: unknown): AuthPasswordResponse {
  if (!isRecord(value)) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const nextAction = getString(value.nextAction)

  if (
    nextAction !== AUTH_NEXT_ACTION.authenticated &&
    nextAction !== AUTH_NEXT_ACTION.setNewPassword &&
    nextAction !== AUTH_NEXT_ACTION.registerPasskey &&
    nextAction !== AUTH_NEXT_ACTION.usePasskey
  ) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const session = isRecord(value.session)
    ? {
        access_token: getRequiredString(value.session, "access_token"),
        refresh_token: getRequiredString(value.session, "refresh_token"),
      }
    : undefined

  return {
    flowId: getString(value.flowId),
    message: getString(value.message) ?? "",
    nextAction,
    session,
  }
}

export function subscribeToAuthSessionChanges(callback: () => void) {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return () => undefined
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    callback()
  })

  return () => subscription.unsubscribe()
}

export async function getCurrentAuthProfile() {
  const supabase = getSupabaseOrThrow()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: rpcProfile, error: rpcError } = await supabase.rpc(
    "get_current_auth_profile"
  )

  if (!rpcError && rpcProfile) {
    const profile = Array.isArray(rpcProfile)
      ? mapAuthProfile(rpcProfile[0])
      : mapAuthProfile(rpcProfile)

    if (profile) {
      return profile
    }
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id, auth_user_id, name, role, status, phone_masked, cpf_masked, email")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapAuthProfile({
    ...data,
    permissions: [],
    passkey_status: "inactive",
  })
}

export async function signInWithPassword(payload: AuthLoginPayload) {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase.functions.invoke(AUTH_FUNCTIONS.password, {
    body: payload,
  })

  if (error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const response = mapPasswordResponse(data)

  if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
    await setSessionIfPresent(response.session)
  }

  return response
}

export async function completeRequiredPassword(input: {
  cpf: string
  currentPassword: string
  flowId: string | null
  newPassword: string
}) {
  const supabase = getSupabaseOrThrow()
  const { data, error } = await supabase.functions.invoke(AUTH_FUNCTIONS.password, {
    body: {
      cpf: input.cpf,
      password: input.currentPassword,
      flowId: input.flowId,
      newPassword: input.newPassword,
    },
  })

  if (error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  return mapPasswordResponse(data)
}

export async function requestAccessRecovery(payload: AuthRecoveryPayload) {
  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.functions.invoke(AUTH_FUNCTIONS.recovery, {
    body: payload,
  })

  if (error) {
    throw new AuthApiError(authCopy.errors.recoveryFailed)
  }
}

export async function signOutCurrentSession() {
  const supabase = getSupabaseOrThrow()
  await supabase.auth.signOut()
}
