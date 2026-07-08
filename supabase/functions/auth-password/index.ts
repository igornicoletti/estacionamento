import {
  authPasswordSchema,
  createAdminClient,
  createPasswordAuthClient,
  genericAuthError,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  normalizeCpf,
  registerRateLimitAttempt,
  writeAuditEvent,
} from "../_shared/index.ts"

const MAX_FAILED_ATTEMPTS = 5
const ACCOUNT_LOCK_MINUTES = 30

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const rawBody = await req.json()
    const parsed = authPasswordSchema.safeParse(rawBody)

    if (!parsed.success) {
      console.error("[auth-password] invalid_payload", {
        hasNewPassword: typeof (rawBody as Record<string, unknown>)?.newPassword === "string",
        issues: parsed.error.issues.map((issue) => ({
          code: issue.code,
          path: issue.path,
        })),
      })
      return genericAuthError(400, req)
    }

    const input = parsed.data
    const cpfHash = await hashSensitiveValue(normalizeCpf(input.cpf))
    const allowed = await registerRateLimitAttempt({
      bucket: "auth-password",
      keyHash: cpfHash,
      lockMinutes: 30,
      maxAttempts: 5,
    })

    if (!allowed) {
      return genericAuthError(429, req)
    }

    const supabase = createAdminClient()
    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("id, auth_user_id, technical_email, name, status, locked_until, failed_attempts")
      .eq("cpf_hmac", cpfHash)
      .maybeSingle()

    if (appUserError) {
      return genericAuthError(undefined, req)
    }

    if (!appUser || appUser.status === "inactive") {
      console.error("[auth-password] user_not_found_or_inactive", {
        found: Boolean(appUser),
        status: appUser?.status ?? null,
      })
      return genericAuthError(400, req)
    }

    if (
      appUser.locked_until &&
      new Date(appUser.locked_until).getTime() > Date.now()
    ) {
      return genericAuthError(429, req)
    }

    const authClient = createPasswordAuthClient()
    const { data: sessionData, error } =
      await authClient.auth.signInWithPassword({
        email: String(appUser.technical_email),
        password: input.password,
      })

    if (error || !sessionData.session) {
      const nextFailedAttempts = Number(appUser.failed_attempts ?? 0) + 1
      const shouldLockAccount = nextFailedAttempts >= MAX_FAILED_ATTEMPTS
      const lockedUntil = shouldLockAccount
        ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60_000).toISOString()
        : null

      const { error: failedAttemptError } = await supabase
        .from("app_users")
        .update({
          failed_attempts: nextFailedAttempts,
          last_failed_at: new Date().toISOString(),
          locked_until: lockedUntil,
        })
        .eq("id", appUser.id)

      if (failedAttemptError) {
        return genericAuthError(undefined, req)
      }

      if (shouldLockAccount) {
        await writeAuditEvent({
          actor: String(appUser.name),
          event: "account_locked",
          scope: "login",
          severity: "warning",
          success: false,
          target: String(appUser.name),
          targetUserId: String(appUser.auth_user_id),
        })

        return genericAuthError(429, req)
      }

      console.error("[auth-password] sign_in_failed", {
        errorMessage: error?.message ?? null,
        errorStatus: error?.status ?? null,
        hasNewPassword: Boolean(input.newPassword),
        status: appUser.status,
      })

      return genericAuthError(400, req)
    }

    const { error: clearFailuresError } = await supabase
      .from("app_users")
      .update({ failed_attempts: 0, last_failed_at: null, locked_until: null })
      .eq("id", appUser.id)

    if (clearFailuresError) {
      return genericAuthError(undefined, req)
    }

    if (input.newPassword) {
      const { error: updateError } =
        await supabase.auth.admin.updateUserById(String(appUser.auth_user_id), {
          password: input.newPassword,
        })

      if (updateError) {
        console.error("[auth-password] update_password_failed", {
          errorMessage: updateError.message,
          status: updateError.status ?? null,
        })
        return genericAuthError(400, req)
      }

      const { error: passkeyResetError } = await supabase
        .from("app_users")
        .update({ status: "passkey_reset" })
        .eq("id", appUser.id)
        .select("id")
        .maybeSingle()

      if (passkeyResetError) {
        return genericAuthError(undefined, req)
      }
      await writeAuditEvent({
        actor: String(appUser.name),
        event: "password_changed",
        scope: "system",
        success: true,
        target: String(appUser.name),
        targetUserId: String(appUser.auth_user_id),
      })
      return jsonResponse({
        flowId: input.flowId,
        message: "Cadastre sua passkey.",
        nextAction: "register_passkey",
        session: sessionData.session,
      }, 200, req)
    }

    if (appUser.status === "pending" || appUser.status === "password_reset") {
      return jsonResponse({
        flowId: input.flowId,
        message: "Defina uma nova senha.",
        nextAction: "set_new_password",
        session: sessionData.session,
      }, 200, req)
    }

    if (appUser.status === "passkey_reset") {
      return jsonResponse({
        flowId: input.flowId,
        message: "Cadastre sua passkey.",
        nextAction: "register_passkey",
        session: sessionData.session,
      }, 200, req)
    }

    return jsonResponse({
      flowId: input.flowId,
      message: "Autenticado.",
      nextAction: "authenticated",
      session: sessionData.session,
    }, 200, req)
  } catch (caughtError) {
    console.error("[auth-password] unexpected_error", {
      message: caughtError instanceof Error ? caughtError.message : String(caughtError),
    })
    return genericAuthError(400, req)
  }
})
