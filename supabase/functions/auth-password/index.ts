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

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const input = authPasswordSchema.parse(await req.json())
    const cpfHash = await hashSensitiveValue(normalizeCpf(input.cpf))
    const allowed = await registerRateLimitAttempt({
      bucket: "auth-password",
      keyHash: cpfHash,
      lockMinutes: 30,
      maxAttempts: 5,
    })

    if (!allowed) {
      return genericAuthError(429)
    }

    const supabase = createAdminClient()
    const { data: appUser } = await supabase
      .from("app_users")
      .select("id, auth_user_id, technical_email, name, status, locked_until, failed_attempts")
      .eq("cpf_hmac", cpfHash)
      .maybeSingle()

    if (!appUser || appUser.status === "inactive") {
      return genericAuthError()
    }

    if (
      appUser.locked_until &&
      new Date(appUser.locked_until).getTime() > Date.now()
    ) {
      return genericAuthError(429)
    }

    const authClient = createPasswordAuthClient()
    const { data: sessionData, error } =
      await authClient.auth.signInWithPassword({
        email: String(appUser.technical_email),
        password: input.password,
      })

    if (error || !sessionData.session) {
      await supabase
        .from("app_users")
        .update({
          failed_attempts: Number(appUser.failed_attempts ?? 0) + 1,
          last_failed_at: new Date().toISOString(),
        })
        .eq("id", appUser.id)
      return genericAuthError()
    }

    await supabase
      .from("app_users")
      .update({ failed_attempts: 0, last_failed_at: null })
      .eq("id", appUser.id)

    if (input.newPassword) {
      await supabase.auth.admin.updateUserById(String(appUser.auth_user_id), {
        password: input.newPassword,
      })
      await supabase
        .from("app_users")
        .update({ status: "passkey_reset" })
        .eq("id", appUser.id)
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
      })
    }

    if (appUser.status === "pending" || appUser.status === "password_reset") {
      return jsonResponse({
        flowId: input.flowId,
        message: "Defina uma nova senha.",
        nextAction: "set_new_password",
        session: sessionData.session,
      })
    }

    if (appUser.status === "passkey_reset") {
      return jsonResponse({
        flowId: input.flowId,
        message: "Cadastre sua passkey.",
        nextAction: "register_passkey",
        session: sessionData.session,
      })
    }

    return jsonResponse({
      flowId: input.flowId,
      message: "Autenticado.",
      nextAction: "authenticated",
      session: sessionData.session,
    })
  } catch {
    return genericAuthError()
  }
})
