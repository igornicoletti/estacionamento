import {
  adminActionSchema,
  clearRateLimitByKeyHash,
  createAdminClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  requireAdminActor,
  writeAuditEvent
} from "../_shared/index.ts"

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const actor = requireAdminActor(await getAuthenticatedActor(req))
    const input = adminActionSchema.parse(await req.json())
    const supabase = createAdminClient()

    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("cpf_hmac, name, status")
      .eq("auth_user_id", input.targetUserId)
      .maybeSingle()

    if (appUserError || !appUser) {
      return genericAuthError(400, req)
    }

    const updatePayload: Record<string, unknown> = {
      failed_attempts: 0,
      last_failed_at: null,
      locked_until: null,
      updated_by: actor.authUserId,
    }

    if (appUser?.status === "inactive") {
      updatePayload.status = "active"
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("app_users")
      .update(updatePayload)
      .eq("auth_user_id", input.targetUserId)
      .select("id")
      .maybeSingle()

    if (updateError || !updatedUser) {
      return genericAuthError(undefined, req)
    }

    // Also clear the rate limiter so the user is not re-blocked immediately
    if (appUser?.cpf_hmac) {
      await clearRateLimitByKeyHash({
        bucket: "auth-password",
        keyHash: String(appUser.cpf_hmac),
      })
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: appUser.status === "inactive"
        ? "user_unblocked"
        : "temporary_lock_cleared",
      reason: input.reason,
      scope: "system",
      success: true,
      target: appUser.name,
      targetUserId: input.targetUserId,
    })

    return jsonResponse({ message: "Bloqueio limpo." }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
