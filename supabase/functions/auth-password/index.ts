import {
  createAdminClient,
  createPasswordAuthClient,
  genericAuthError,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  normalizeCpf,
  writeAuditEvent,
} from "../_shared/index.ts"

const maxFailedAttempts = 5
const lockMinutes = 15
const flowMinutes = 10

type NextAction =
  | "authenticated"
  | "set_new_password"
  | "register_passkey"
  | "use_passkey"

interface PasswordRequest {
  cpf: string
  flowId?: string | null
  newPassword?: string | null
  password: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function parsePasswordRequest(value: unknown): PasswordRequest {
  if (!isRecord(value)) {
    throw new Error("Payload inválido.")
  }

  const cpf = normalizeCpf(typeof value.cpf === "string" ? value.cpf : "")
  const password = typeof value.password === "string" ? value.password : ""
  const flowId = typeof value.flowId === "string" ? value.flowId : null
  const newPassword = typeof value.newPassword === "string" ? value.newPassword : null

  if (cpf.length !== 11 || password.length < 1) {
    throw new Error("Credenciais inválidas.")
  }

  return { cpf, flowId, newPassword, password }
}

function isLocked(lockedUntil: string | null | undefined) {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now())
}

function resolveNextAction(status: string): NextAction {
  if (status === "pending" || status === "password_reset") {
    return "set_new_password"
  }

  if (status === "passkey_reset") {
    return "register_passkey"
  }

  return "authenticated"
}

async function recordFailedAttempt(
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

  const result = data?.[0]

  await writeAuditEvent({
    actor: "Sistema",
    event: "login_failed",
    metadata: { locked: Boolean(result?.locked_until) },
    scope: "login",
    success: false,
    target: targetName,
  })
}

async function createPasswordFlow(input: {
  appUserId: string
  cpfHash: string
  purpose: "first_access" | "password_reset" | "passkey_reset"
}) {
  const admin = createAdminClient()
  const response = await admin
    .from("auth_flow_attempts")
    .insert({
      app_user_id: input.appUserId,
      cpf_hmac: input.cpfHash,
      expires_at: new Date(Date.now() + flowMinutes * 60_000).toISOString(),
      purpose: input.purpose,
    })
    .select("flow_id")
    .single()

  if (response.error || !response.data) {
    throw new Error("Não foi possível iniciar o fluxo.")
  }

  return response.data.flow_id
}

async function consumePasswordFlow(input: {
  cpfHash: string
  flowId: string
}) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("internal_consume_auth_flow", {
    p_allowed_purposes: ["first_access", "password_reset"],
    p_cpf_hmac: input.cpfHash,
    p_flow_id: input.flowId,
  }) as {
    data: Array<{ app_user_id: string; id: string; purpose: string }> | null
    error: { message?: string } | null
  }

  if (error || !data?.[0]) {
    if (error) {
      console.error("password_flow_consume_failed", { error: error.message })
    }
    throw new Error("Fluxo expirado.")
  }
}

async function clearFailedAttempts(authUserId: string) {
  const admin = createAdminClient()
  const { error } = await admin.rpc("internal_clear_auth_failed_attempts", {
    p_auth_user_id: authUserId,
  })

  if (error) {
    console.error("clear_failed_attempts_rpc_failed", { error: error.message })
  }
}

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const input = parsePasswordRequest(await request.json())
    const cpfHash = await hashSensitiveValue(input.cpf)
    const admin = createAdminClient()
    const appUserResponse = await admin
      .from("app_users")
      .select("id, auth_user_id, technical_email, name, status, failed_attempts, locked_until")
      .eq("cpf_hmac", cpfHash)
      .maybeSingle()

    if (appUserResponse.error || !appUserResponse.data) {
      return genericAuthError(401, request)
    }

    const appUser = appUserResponse.data

    if (isLocked(appUser.locked_until)) {
      return genericAuthError(423, request)
    }

    const passwordClient = createPasswordAuthClient()
    const signInResponse = await passwordClient.auth.signInWithPassword({
      email: appUser.technical_email,
      password: input.password,
    })

    if (signInResponse.error || !signInResponse.data.session) {
      await recordFailedAttempt(cpfHash, appUser.name)
      return genericAuthError(401, request)
    }

    await clearFailedAttempts(appUser.auth_user_id)

    if (input.flowId && input.newPassword) {
      await consumePasswordFlow({ cpfHash, flowId: input.flowId })

      const updateResponse = await admin.auth.admin.updateUserById(
        appUser.auth_user_id,
        { password: input.newPassword }
      )

      if (updateResponse.error) {
        return genericAuthError(400, request)
      }

      await admin
        .from("app_users")
        .update({ status: "passkey_reset" })
        .eq("auth_user_id", appUser.auth_user_id)

      const passkeyFlowId = await createPasswordFlow({
        appUserId: appUser.id,
        cpfHash,
        purpose: "passkey_reset",
      })

      const updatedPasswordSignInResponse = await passwordClient.auth.signInWithPassword({
        email: appUser.technical_email,
        password: input.newPassword,
      })

      if (
        updatedPasswordSignInResponse.error ||
        !updatedPasswordSignInResponse.data.session
      ) {
        return genericAuthError(400, request)
      }

      await writeAuditEvent({
        actor: appUser.name,
        actorUserId: appUser.auth_user_id,
        event: "password_changed",
        request,
        scope: "login",
        success: true,
        target: appUser.name,
        targetUserId: appUser.auth_user_id,
      })

      return jsonResponse({
        flowId: passkeyFlowId,
        message: "Senha atualizada. Cadastre a passkey para concluir o acesso.",
        nextAction: "register_passkey",
        session: {
          access_token: updatedPasswordSignInResponse.data.session.access_token,
          refresh_token: updatedPasswordSignInResponse.data.session.refresh_token,
        },
      }, 200, request)
    }

    const nextAction = resolveNextAction(appUser.status)

    if (nextAction === "set_new_password" || nextAction === "register_passkey") {
      const flowId = await createPasswordFlow({
        appUserId: appUser.id,
        cpfHash,
        purpose: appUser.status === "passkey_reset"
          ? "passkey_reset"
          : appUser.status === "pending"
            ? "first_access"
            : "password_reset",
      })

      return jsonResponse({
        flowId,
        message: "Ação adicional necessária.",
        nextAction,
        ...(nextAction === "register_passkey"
          ? {
              session: {
                access_token: signInResponse.data.session.access_token,
                refresh_token: signInResponse.data.session.refresh_token,
              },
            }
          : {}),
      }, 200, request)
    }

    if (appUser.status !== "active") {
      return genericAuthError(403, request)
    }

    await writeAuditEvent({
      actor: appUser.name,
      actorUserId: appUser.auth_user_id,
      event: "login_success",
      request,
      scope: "login",
      success: true,
      target: appUser.name,
      targetUserId: appUser.auth_user_id,
    })

    return jsonResponse({
      flowId: null,
      message: "Autenticado.",
      nextAction,
      session: {
        access_token: signInResponse.data.session.access_token,
        refresh_token: signInResponse.data.session.refresh_token,
      },
    }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
