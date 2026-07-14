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

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)
    const input = flowCpfSchema.parse(await request.json())

    if (!actor || actor.status !== "active") {
      return genericAuthError(401, request)
    }

    const cpfHash = await hashSensitiveValue(normalizeCpf(input.cpf))
    const supabase = createAdminClient()
    const { data: flow, error: flowError } = await supabase
      .from("auth_flow_attempts")
      .select("id, cpf_hmac, consumed_at, expires_at")
      .eq("flow_id", input.flowId)
      .maybeSingle()

    if (
      flowError ||
      !flow ||
      flow.cpf_hmac !== cpfHash ||
      flow.consumed_at ||
      new Date(String(flow.expires_at)).getTime() <= Date.now()
    ) {
      return genericAuthError(400, request)
    }

    await supabase
      .from("auth_flow_attempts")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", flow.id)

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "login_passkey_success",
      request,
      scope: "login",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({
      flowId: input.flowId,
      message: "Autenticado.",
      nextAction: "authenticated",
    }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
