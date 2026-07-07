import {
  adminPhoneChangeReviewSchema,
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
    const input = adminPhoneChangeReviewSchema.parse(await req.json())
    const supabase = createAdminClient()
    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("name, pending_phone_masked")
      .eq("auth_user_id", input.targetUserId)
      .maybeSingle()

    if (appUserError || !appUser || !appUser.pending_phone_masked) {
      return genericAuthError(400, req)
    }

    const nextValues =
      input.decision === "approved"
        ? {
            pending_phone_masked: null,
            phone_masked: appUser.pending_phone_masked,
            phone_verified_at: new Date().toISOString(),
            updated_by: actor.authUserId,
          }
        : {
            pending_phone_masked: null,
            updated_by: actor.authUserId,
          }

    const { error: updateError } = await supabase
      .from("app_users")
      .update(nextValues)
      .eq("auth_user_id", input.targetUserId)

    if (updateError) {
      return genericAuthError(undefined, req)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "phone_change_reviewed",
      reason: input.decision,
      scope: "system",
      success: true,
      target: appUser.name,
      targetUserId: input.targetUserId,
    })

    return jsonResponse(
      {
        message:
          input.decision === "approved"
            ? "Alteração de telefone aprovada."
            : "Alteração de telefone negada.",
      },
      200,
      req
    )
  } catch {
    return genericAuthError(400, req)
  }
})
