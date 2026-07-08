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

    if (input.targetUserId === actor.authUserId) {
      return genericAuthError(400, req)
    }

    const { data: targetUser, error: targetUserError } = await supabase
      .from("app_users")
      .select("id, name")
      .eq("auth_user_id", input.targetUserId)
      .maybeSingle()

    if (targetUserError || !targetUser) {
      return genericAuthError(400, req)
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("app_users")
      .update({
        failed_attempts: 0,
        locked_until: null,
        status: "password_reset",
        updated_by: actor.authUserId,
      })
      .eq("auth_user_id", input.targetUserId)
      .select("id")
      .maybeSingle()

    if (updateError || !updatedUser) {
      return genericAuthError(undefined, req)
    }

    const { error: revokeError } = await supabase
      .schema("private")
      .rpc("revoke_auth_sessions", { target_user_id: input.targetUserId })

    if (revokeError) {
      return genericAuthError(undefined, req)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "password_reset_requested",
      reason: input.reason,
      scope: "system",
      success: true,
      target: targetUser.name,
      targetUserId: input.targetUserId,
    })

    return jsonResponse({ message: "Reset de senha aplicado." }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
