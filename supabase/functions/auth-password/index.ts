// A persistência em auth_flow_attempts fica isolada em auth-password-flow.ts.
import {
  createAdminClient,
  createPasswordAuthClient,
  genericAuthError,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  writeAuditEvent,
} from "../_shared/index.ts"

import {
  isLocked,
  parsePasswordRequest,
  resolveNextAction,
  type AppUserRow,
} from "./auth-password-contracts.ts"
import {
  claimPasswordFlow,
  completePasswordTask,
  createPasswordFlow,
  findAppUser,
  releasePasswordFlowClaim,
} from "./auth-password-flow.ts"
import {
  clearFailedAttempts,
  markPasswordReset,
  recordFailedAttempt,
  revokeAllSessions,
  rollbackPassword,
} from "./auth-password-security.ts"

async function handleRequiredPassword(input: {
  appUser: AppUserRow
  cpfHash: string
  currentPassword: string
  flowId: string
  newPassword: string
  passwordClient: ReturnType<typeof createPasswordAuthClient>
  request: Request
}) {
  const claimToken = crypto.randomUUID()
  const claimed = await claimPasswordFlow({
    appUserId: input.appUser.id,
    claimToken,
    cpfHash: input.cpfHash,
    flowId: input.flowId,
  })

  if (!claimed) {
    return genericAuthError(400, input.request)
  }

  const admin = createAdminClient()
  const updatePasswordResponse = await admin.auth.admin.updateUserById(
    input.appUser.auth_user_id,
    { password: input.newPassword }
  )

  if (updatePasswordResponse.error) {
    await releasePasswordFlowClaim({
      appUserId: input.appUser.id,
      claimToken,
      flowId: input.flowId,
    })
    return genericAuthError(400, input.request)
  }

  const taskCompletion = await completePasswordTask({
    appUserId: input.appUser.id,
    claimToken,
    cpfHash: input.cpfHash,
    flowId: input.flowId,
  })

  if (taskCompletion === "not_completed") {
    const rolledBack = await rollbackPassword(
      input.appUser.auth_user_id,
      input.currentPassword
    )
    await releasePasswordFlowClaim({
      appUserId: input.appUser.id,
      claimToken,
      flowId: input.flowId,
    })

    if (!rolledBack) {
      await markPasswordReset(input.appUser.auth_user_id)
    }

    return genericAuthError(400, input.request)
  }

  if (taskCompletion === "unknown") {
    await markPasswordReset(input.appUser.auth_user_id)

    try {
      await revokeAllSessions(input.appUser.auth_user_id)
    } catch (caughtError) {
      console.error("password_unknown_state_session_revoke_failed", {
        error: caughtError instanceof Error ? caughtError.message : "unknown",
      })
    }

    return genericAuthError(400, input.request)
  }

  try {
    await revokeAllSessions(input.appUser.auth_user_id)
  } catch {
    await markPasswordReset(input.appUser.auth_user_id)
    return genericAuthError(400, input.request)
  }

  const newSessionResponse = await input.passwordClient.auth.signInWithPassword({
    email: input.appUser.technical_email,
    password: input.newPassword,
  })

  if (newSessionResponse.error || !newSessionResponse.data.session) {
    return genericAuthError(400, input.request)
  }

  await writeAuditEvent({
    actor: input.appUser.name,
    actorUserId: input.appUser.auth_user_id,
    event: "password_changed",
    request: input.request,
    scope: "login",
    success: true,
    target: input.appUser.name,
    targetUserId: input.appUser.auth_user_id,
  }).catch((caughtError) => console.error("[audit-fail]", caughtError))

  return jsonResponse({
    flowId: null,
    message: "Senha atualizada.",
    nextAction: "authenticated",
    session: {
      access_token: newSessionResponse.data.session.access_token,
      refresh_token: newSessionResponse.data.session.refresh_token,
    },
  }, 200, input.request)
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
    const appUser = await findAppUser(cpfHash)

    if (!appUser) {
      return genericAuthError(401, request)
    }

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
      if (appUser.status !== "pending" && appUser.status !== "password_reset") {
        return genericAuthError(400, request)
      }

      return handleRequiredPassword({
        appUser,
        cpfHash,
        currentPassword: input.password,
        flowId: input.flowId,
        newPassword: input.newPassword,
        passwordClient,
        request,
      })
    }

    const nextAction = resolveNextAction(appUser.status)

    if (nextAction === "set_new_password") {
      const flowId = await createPasswordFlow({
        appUserId: appUser.id,
        cpfHash,
        purpose: appUser.status === "pending" ? "first_access" : "password_reset",
      })

      await revokeAllSessions(appUser.auth_user_id)

      return jsonResponse({
        flowId,
        message: "Troca de senha necessária.",
        nextAction,
      }, 200, request)
    }

    if (appUser.status !== "active" && appUser.status !== "passkey_reset") {
      return genericAuthError(403, request)
    }

    if (appUser.status === "passkey_reset") {
      const admin = createAdminClient()
      const normalizeStatusResponse = await admin
        .from("app_users")
        .update({ status: "active" })
        .eq("auth_user_id", appUser.auth_user_id)

      if (normalizeStatusResponse.error) {
        return genericAuthError(400, request)
      }
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
    }).catch((caughtError) => console.error("[audit-fail]", caughtError))

    return jsonResponse({
      flowId: null,
      message: "Autenticado.",
      nextAction: "authenticated",
      session: {
        access_token: signInResponse.data.session.access_token,
        refresh_token: signInResponse.data.session.refresh_token,
      },
    }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
