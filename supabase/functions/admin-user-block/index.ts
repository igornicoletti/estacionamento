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

    if (input.targetUserId === actor.authUserId) {
      return genericAuthError(400, req)
    }

    const supabase = createAdminClient()
    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("name")
      .eq("auth_user_id", input.targetUserId)
      .maybeSingle()

    if (appUserError || !appUser) {
      return genericAuthError(400, req)
    }

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        status: "inactive",
        updated_by: actor.authUserId,
      })
      .eq("auth_user_id", input.targetUserId)

    if (updateError) {
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
      event: "user_blocked",
      reason: input.reason,
      scope: "system",
      severity: "warning",
      success: true,
      target: appUser.name,
      targetUserId: input.targetUserId,
    })

    return jsonResponse({ message: "Usuário bloqueado." }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
