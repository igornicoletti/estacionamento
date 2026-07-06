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

    await supabase
      .from("app_users")
      .update({
        failed_attempts: 0,
        last_failed_at: null,
        locked_until: null,
        updated_by: actor.authUserId,
      })
      .eq("auth_user_id", input.targetUserId)

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "temporary_lock_cleared",
      reason: input.reason,
      scope: "system",
      success: true,
      target: "Usuário",
      targetUserId: input.targetUserId,
    })

    return jsonResponse({ message: "Bloqueio limpo." })
  } catch {
    return genericAuthError()
  }
})
