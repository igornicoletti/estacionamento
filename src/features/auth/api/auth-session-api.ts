import { authCopy } from "../constants"
import {
  AuthApiError,
  AuthSessionExpiredError,
} from "./auth-api-error"
import {
  getString,
  getSupabaseOrThrow,
  isRecord,
} from "./auth-api-helpers"

export const AUTH_SESSION_LEASE_STATUS = {
  active: "active",
  absoluteExpired: "absolute_expired",
  idleExpired: "idle_expired",
  invalid: "invalid",
  revoked: "revoked",
} as const

export type AuthSessionLeaseStatus =
  (typeof AUTH_SESSION_LEASE_STATUS)[keyof typeof AUTH_SESSION_LEASE_STATUS]

export interface AuthSessionLease {
  absoluteExpiresAt: string | null
  enforcementEnabled: boolean
  idleExpiresAt: string | null
  serverTime: string
  status: AuthSessionLeaseStatus
}

function isLeaseStatus(value: unknown): value is AuthSessionLeaseStatus {
  return (
    typeof value === "string" &&
    Object.values(AUTH_SESSION_LEASE_STATUS).some((status) => status === value)
  )
}

function getFirstRpcRow(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value
  }

  const rows: readonly unknown[] = value
  return rows[0]
}

export function mapAuthSessionLease(value: unknown): AuthSessionLease {
  const record = getFirstRpcRow(value)

  if (!isRecord(record)) {
    throw new AuthApiError(authCopy.errors.sessionLoadFailed)
  }

  const status = getString(record.status)
  const serverTime = getString(record.server_time)

  if (!isLeaseStatus(status) || !serverTime) {
    throw new AuthApiError(authCopy.errors.sessionLoadFailed)
  }

  return {
    absoluteExpiresAt: getString(record.absolute_expires_at),
    enforcementEnabled: record.enforcement_enabled === true,
    idleExpiresAt: getString(record.idle_expires_at),
    serverTime,
    status,
  }
}

export async function touchCurrentAuthSession({
  activityObserved = false,
}: {
  activityObserved?: boolean
} = {}) {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.rpc("touch_current_auth_session", {
    p_activity_observed: activityObserved,
  })

  if (response.error) {
    throw new AuthApiError(authCopy.errors.sessionLoadFailed)
  }

  return mapAuthSessionLease(response.data)
}

export async function requireActiveCurrentAuthSession() {
  const lease = await touchCurrentAuthSession()

  if (lease.status !== AUTH_SESSION_LEASE_STATUS.active) {
    throw new AuthSessionExpiredError()
  }

  return lease
}

async function revokeCurrentAuthSession() {
  const supabase = getSupabaseOrThrow()
  const response = await supabase.rpc("revoke_current_auth_session", {
    p_reason: "logout",
  })

  return response.error
}

export async function signOutCurrentSession() {
  const supabase = getSupabaseOrThrow()
  const revocationError = await revokeCurrentAuthSession()
  const signOutResponse = await supabase.auth.signOut({ scope: "local" })

  if (revocationError || signOutResponse.error) {
    throw new AuthApiError(authCopy.errors.logoutFailed)
  }
}
