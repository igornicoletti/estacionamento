import { createAdminClient, writeAuditEvent } from "../_shared/index.ts"

const maxFailedAttempts = 5
const lockMinutes = 15

export async function recordFailedAttempt(
  cpfHash: string,
  targetName: string
) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("internal_record_auth_failed_attempt", {
    p_cpf_hmac: cpfHash,
    p_lock_minutes: lockMinutes,
    p_max_attempts: maxFailedAttempts,
  }) as {
    data: Array<{ failed_attempts: number; locked_until: string | null }> | null
    error: { message?: string } | null
  }

  if (error) {
    console.error("failed_attempt_rpc_failed", { error: error.message })
  }

  await writeAuditEvent({
    actor: "Sistema",
    event: "login_failed",
    metadata: { locked: Boolean(data?.[0]?.locked_until) },
    scope: "login",
    success: false,
    target: targetName,
  }).catch((caughtError) => console.error("[audit-fail]", caughtError))
}

export async function clearFailedAttempts(authUserId: string) {
  const admin = createAdminClient()
  const { error } = await admin.rpc("internal_clear_auth_failed_attempts", {
    p_auth_user_id: authUserId,
  })

  if (error) {
    console.error("clear_failed_attempts_rpc_failed", { error: error.message })
  }
}

export async function rollbackPassword(authUserId: string, password: string) {
  const admin = createAdminClient()
  const rollbackResponse = await admin.auth.admin.updateUserById(authUserId, {
    password,
  })

  if (rollbackResponse.error) {
    console.error("password_rollback_failed", {
      authUserId,
      error: rollbackResponse.error.message,
    })
    return false
  }

  return true
}

export async function markPasswordReset(authUserId: string) {
  const admin = createAdminClient()
  const response = await admin
    .from("app_users")
    .update({ status: "password_reset" })
    .eq("auth_user_id", authUserId)

  if (response.error) {
    console.error("password_reset_status_failed", {
      authUserId,
      error: response.error.message,
    })
  }
}

export async function revokeAllSessions(authUserId: string) {
  const admin = createAdminClient()
  const signOutResponse = await admin.auth.admin.signOut(authUserId, "global")

  if (signOutResponse.error) {
    throw new Error("Não foi possível revogar as sessões anteriores.")
  }
}
