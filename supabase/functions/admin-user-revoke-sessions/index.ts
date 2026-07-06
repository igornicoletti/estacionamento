import {
  adminActionSchema,
  createAdminClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  requireAdminActor,
  writeAuditEvent,
} from "../_shared/index.ts"

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const actor = requireAdminActor(await getAuthenticatedActor(req))
    const input = adminActionSchema.parse(await req.json())
    const supabase = createAdminClient()

    const { error: revokeError } = await supabase
      .schema("private")
      .rpc("revoke_auth_sessions", { target_user_id: input.targetUserId })

    if (revokeError) {
      return genericAuthError(undefined, req)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "sessions_revoked",
      reason: input.reason,
      scope: "system",
      success: true,
      target: "Usuário",
      targetUserId: input.targetUserId,
    })

    return jsonResponse({ message: "Sessões encerradas." }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
