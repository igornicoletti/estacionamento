import {
  createAdminClient,
  flowCpfSchema,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  writeAuditEvent,
} from "../_shared/index.ts"

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const actor = await getAuthenticatedActor(req)
    const input = flowCpfSchema.parse(await req.json())

    if (!actor) {
      return genericAuthError(401)
    }

    const supabase = createAdminClient()
    await supabase
      .from("app_users")
      .update({ status: "active" })
      .eq("auth_user_id", actor.authUserId)
      .in("status", ["pending", "passkey_reset"])

    await supabase
      .from("auth_flow_attempts")
      .update({ consumed_at: new Date().toISOString() })
      .eq("flow_id", input.flowId)

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "passkey_registered",
      scope: "login",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({
      flowId: input.flowId,
      message: "Passkey cadastrada.",
      nextAction: "authenticated",
    })
  } catch {
    return genericAuthError()
  }
})
