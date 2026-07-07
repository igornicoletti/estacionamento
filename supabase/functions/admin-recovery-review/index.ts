import {
  adminRecoveryReviewSchema,
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
    const input = adminRecoveryReviewSchema.parse(await req.json())
    const supabase = createAdminClient()
    const { data: request, error: requestError } = await supabase
      .from("access_recovery_requests")
      .select("id, cpf_hmac, status")
      .eq("id", input.requestId)
      .maybeSingle()

    if (requestError || !request || request.status !== "pending") {
      return genericAuthError(400, req)
    }

    const { error: updateRequestError } = await supabase
      .from("access_recovery_requests")
      .update({
        review_reason: input.reviewReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: actor.authUserId,
        status: input.decision,
      })
      .eq("id", input.requestId)

    if (updateRequestError) {
      return genericAuthError(undefined, req)
    }

    let matchedAppUser:
      | {
          auth_user_id: string
          id: string
          name: string
        }
      | null = null

    if (input.decision === "approved") {
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("id, auth_user_id, name")
        .eq("cpf_hmac", request.cpf_hmac)
        .maybeSingle()

      if (appUserError) {
        return genericAuthError(undefined, req)
      }

      matchedAppUser = appUser

      if (matchedAppUser) {
        const { error: updateAppUserError } = await supabase
          .from("app_users")
          .update({
            failed_attempts: 0,
            locked_until: null,
            status: "password_reset",
            updated_by: actor.authUserId,
          })
          .eq("id", matchedAppUser.id)

        if (updateAppUserError) {
          return genericAuthError(undefined, req)
        }

        const { error: revokeError } = await supabase
          .schema("private")
          .rpc("revoke_auth_sessions", {
            target_user_id: matchedAppUser.auth_user_id,
          })

        if (revokeError) {
          return genericAuthError(undefined, req)
        }
      }
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "access_recovery_reviewed",
      reason: input.reviewReason,
      scope: "system",
      severity: input.decision === "approved" ? "info" : "warning",
      success: true,
      target: matchedAppUser?.name ?? "Conta não localizada",
      targetUserId: matchedAppUser?.auth_user_id,
    })

    return jsonResponse(
      {
        message:
          input.decision === "approved"
            ? "Solicitação aprovada."
            : "Solicitação negada.",
      },
      200,
      req
    )
  } catch {
    return genericAuthError(400, req)
  }
})
