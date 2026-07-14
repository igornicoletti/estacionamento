import {
  createAdminClient,
  flowCpfSchema,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  normalizeCpf,
  writeAuditEvent,
} from "../_shared/index.ts"

function isExpired(value: string) {
  return new Date(value).getTime() <= Date.now()
}

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)

    if (!actor) {
      return genericAuthError(401, request)
    }

    const input = flowCpfSchema.parse(await request.json())
    const cpfHash = await hashSensitiveValue(normalizeCpf(input.cpf))
    const supabase = createAdminClient()
    const { data: flow, error: flowError } = await supabase
      .from("auth_flow_attempts")
      .select("id, app_user_id, cpf_hmac, consumed_at, expires_at, purpose")
      .eq("flow_id", input.flowId)
      .maybeSingle()

    if (
      flowError ||
      !flow ||
      flow.cpf_hmac !== cpfHash ||
      flow.consumed_at ||
      isExpired(String(flow.expires_at))
    ) {
      return genericAuthError(400, request)
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("id, auth_user_id, name, status")
      .eq("id", flow.app_user_id)
      .maybeSingle()

    if (
      appUserError ||
      !appUser ||
      appUser.auth_user_id !== actor.authUserId ||
      (appUser.status !== "pending" &&
        appUser.status !== "passkey_reset" &&
        appUser.status !== "active")
    ) {
      return genericAuthError(403, request)
    }

    const { count: passkeyCount, error: passkeyCountError } = await supabase
      .schema("auth")
      .from("webauthn_credentials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", actor.authUserId)

    if (passkeyCountError || !passkeyCount) {
      return genericAuthError(400, request)
    }

    const updateResponse = await supabase
      .from("app_users")
      .update({
        failed_attempts: 0,
        last_failed_at: null,
        locked_until: null,
        status: "active",
      })
      .eq("auth_user_id", actor.authUserId)

    if (updateResponse.error) {
      return genericAuthError(400, request)
    }

    await supabase
      .from("auth_flow_attempts")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", flow.id)

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "passkey_registered",
      request,
      scope: "login",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({
      flowId: input.flowId,
      message: "Passkey cadastrada.",
      nextAction: "authenticated",
    }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
