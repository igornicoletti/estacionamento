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

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const actor = await getAuthenticatedActor(req)
    const input = flowCpfSchema.parse(await req.json())

    if (!actor || actor.status !== "active") {
      return genericAuthError(401, req)
    }

    const cpfHash = await hashSensitiveValue(normalizeCpf(input.cpf))
    const supabase = createAdminClient()
    const { data: flow } = await supabase
      .from("auth_flow_attempts")
      .select("flow_id, cpf_hmac, expires_at, consumed_at")
      .eq("flow_id", input.flowId)
      .maybeSingle()

    if (
      !flow ||
      flow.consumed_at ||
      flow.cpf_hmac !== cpfHash ||
      new Date(flow.expires_at).getTime() < Date.now()
    ) {
      return genericAuthError(400, req)
    }

    await supabase
      .from("auth_flow_attempts")
      .update({ consumed_at: new Date().toISOString() })
      .eq("flow_id", input.flowId)
    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "login_passkey_success",
      scope: "login",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({
      flowId: input.flowId,
      message: "Autenticado.",
      nextAction: "authenticated",
    }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
