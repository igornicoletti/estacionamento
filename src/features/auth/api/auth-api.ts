import { getSupabaseBrowserClient } from "@/lib"

import {
  AUTH_FUNCTIONS,
  AUTH_NEXT_ACTION,
  AUTH_STATUS,
  normalizeAuthStatus,
  resolveAuthProfilePermissions,
} from "../contracts/auth-contracts"
import { authCopy } from "../copy/auth-copy"
import type {
  AuthPasswordResponse,
  AuthProfile,
  AuthRoleProfile,
  AuthSessionPayload,
} from "../types/auth-types"
import type { AuthLoginPayload, AuthRecoveryPayload } from "../validation/auth-validation"

type UnknownRecord = Record<PropertyKey, unknown>

export class AuthApiError extends Error {
  constructor(message: string = authCopy.errors.unavailable) {
    super(message)
    this.name = "AuthApiError"
  }
}

export function isPasskeySupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  )
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
    status: normalizeAuthStatus(value.status) ?? AUTH_STATUS.inactive,
    permissions: resolveAuthProfilePermissions({
      permissions: value.permissions,
      roleKey: role?.key,
    }),
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
  const sessionResponse = await supabase.auth.setSession(session)

  if (sessionResponse.error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }
}

async function readFunctionErrorMessage(error: unknown) {
  const record = isRecord(error) ? error : null
  const context = record?.context

  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { message?: unknown }

      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message
      }
    } catch {
      return null
    }
  }

  return error instanceof Error && error.message.trim() ? error.message : null
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

  return profile
}

export async function signInWithPassword(payload: AuthLoginPayload) {
  const supabase = getSupabaseOrThrow()
  const passwordResponse = await supabase.functions.invoke(AUTH_FUNCTIONS.password, {
    body: payload,
  })

  if (passwordResponse.error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const response = mapPasswordResponse(passwordResponse.data)

  if (
    response.nextAction === AUTH_NEXT_ACTION.authenticated ||
    response.nextAction === AUTH_NEXT_ACTION.registerPasskey
  ) {
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
  const passwordResponse = await supabase.functions.invoke(AUTH_FUNCTIONS.password, {
    body: {
      cpf: input.cpf,
      password: input.currentPassword,
      flowId: input.flowId,
      newPassword: input.newPassword,
    },
  })

  if (passwordResponse.error) {
    throw new AuthApiError(authCopy.errors.invalidCredentials)
  }

  const response = mapPasswordResponse(passwordResponse.data)

  if (
    response.nextAction === AUTH_NEXT_ACTION.authenticated ||
    response.nextAction === AUTH_NEXT_ACTION.registerPasskey
  ) {
    await setSessionIfPresent(response.session)
  }

  return response
}

export async function registerCurrentPasskey(input: {
  cpf: string
  flowId: string | null
}) {
  if (!input.flowId) {
    throw new AuthApiError(authCopy.errors.passkeyRegistrationFailed)
  }

  if (!isPasskeySupported()) {
    throw new AuthApiError(authCopy.errors.passkeyNotSupported)
  }

  const supabase = getSupabaseOrThrow()
  const registrationResponse = await supabase.auth.registerPasskey()

  if (registrationResponse.error) {
    throw new AuthApiError(authCopy.errors.passkeyRegistrationFailed)
  }

  const completionResponse = await supabase.functions.invoke(
    AUTH_FUNCTIONS.registerPasskey,
    {
      body: input,
    }
  )

  if (completionResponse.error) {
    throw new AuthApiError(
      (await readFunctionErrorMessage(completionResponse.error)) ??
        authCopy.errors.passkeyRegistrationFailed
    )
  }

  const response = mapPasswordResponse(completionResponse.data)

  if (response.nextAction !== AUTH_NEXT_ACTION.authenticated) {
    throw new AuthApiError(authCopy.errors.passkeyRegistrationFailed)
  }

  return response
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

  void supabase.functions.invoke(AUTH_FUNCTIONS.passkeyLogin, { body: {} })
}

export async function requestAccessRecovery(payload: AuthRecoveryPayload) {
  const supabase = getSupabaseOrThrow()
  const recoveryResponse = await supabase.functions.invoke(AUTH_FUNCTIONS.recovery, {
    body: payload,
  })

  if (recoveryResponse.error) {
    throw new AuthApiError(authCopy.errors.recoveryFailed)
  }
}

export async function signOutCurrentSession() {
  const supabase = getSupabaseOrThrow()
  const { error } = await supabase.auth.signOut({ scope: "local" })

  if (error) {
    throw new AuthApiError(authCopy.errors.logoutFailed)
  }
}
