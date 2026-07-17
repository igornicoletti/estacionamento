import {
  actorHasPermission,
  authError,
  createAdminClient,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  newPasswordSchema,
  writeAuditEvent,
} from "../_shared/index.ts"

type Decision = "approved" | "denied"
function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null
}

function readDecision(value: unknown): Decision | null {
  return value === "approved" || value === "denied" ? value : null
}

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return authError("method_not_allowed", 405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)
    const supabase = createAdminClient()

    if (!actor || actor.status !== "active") {
      return authError("unauthorized", 401, request)
    }

    if (!(await actorHasPermission(actor, "access_requests.review", supabase))) {
      return authError("forbidden", 403, request)
    }

    const body = await request.json().catch(() => null)

    if (!isRecord(body)) {
      return authError("invalid_payload", 400, request)
    }

    const requestId = readString(body.requestId)
    const decision = readDecision(body.decision)
    const temporaryPassword = readString(body.temporaryPassword)

    if (!requestId || !decision) {
      return authError("invalid_payload", 400, request)
    }

    if (
      decision === "approved" &&
      !newPasswordSchema.safeParse(temporaryPassword).success
    ) {
      return authError("invalid_payload", 400, request)
    }

    const recoveryResponse = await supabase
      .from("access_recovery_requests")
      .select("id, cpf_hmac")
      .eq("id", requestId)
      .eq("status", "pending")
      .maybeSingle()

    if (recoveryResponse.error || !recoveryResponse.data) {
      if (recoveryResponse.error) {
        console.error("recovery_review_lookup_failed", recoveryResponse.error.message)
        return authError("request_failed", 400, request)
      }

      return authError("not_found", 404, request)
    }

    const targetResponse = await supabase
      .from("app_users")
      .select("id, auth_user_id, name")
      .eq("cpf_hmac", recoveryResponse.data.cpf_hmac)
      .maybeSingle()

    if (targetResponse.error) {
      console.error("recovery_target_lookup_failed", targetResponse.error.message)
      return authError("request_failed", 400, request)
    }

    const target = targetResponse.data

    if (decision === "approved" && !target) {
      return authError("not_found", 404, request)
    }

    if (decision === "approved" && target && temporaryPassword) {
      const passwordResponse = await supabase.auth.admin.updateUserById(
        target.auth_user_id,
        { password: temporaryPassword }
      )

      if (passwordResponse.error) {
        console.error("recovery_password_update_failed", passwordResponse.error.message)
        return authError("request_failed", 400, request)
      }

      const targetUpdateResponse = await supabase
        .from("app_users")
        .update({
          failed_attempts: 0,
          last_failed_at: null,
          locked_until: null,
          status: "password_reset",
          updated_at: new Date().toISOString(),
          updated_by: actor.authUserId,
        })
        .eq("auth_user_id", target.auth_user_id)

      if (targetUpdateResponse.error) {
        console.error("recovery_target_update_failed", targetUpdateResponse.error.message)
        return authError("request_failed", 400, request)
      }

      await supabase.auth.admin.signOut(target.auth_user_id, "global")
    }

    if (decision === "denied" && target) {
      const targetUpdateResponse = await supabase
        .from("app_users")
        .update({
          locked_until: null,
          status: "inactive",
          updated_at: new Date().toISOString(),
          updated_by: actor.authUserId,
        })
        .eq("auth_user_id", target.auth_user_id)

      if (targetUpdateResponse.error) {
        console.error("recovery_target_block_failed", targetUpdateResponse.error.message)
        return authError("request_failed", 400, request)
      }

      await supabase.auth.admin.signOut(target.auth_user_id, "global")
    }

    const updateResponse = await supabase
      .from("access_recovery_requests")
      .update({
        reviewed_at: new Date().toISOString(),
        reviewed_by: actor.authUserId,
        status: decision,
      })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle()

    if (updateResponse.error || !updateResponse.data) {
      if (updateResponse.error) {
        console.error("recovery_review_update_failed", updateResponse.error.message)
        return authError("request_failed", 400, request)
      }

      return authError("not_found", 404, request)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "access_recovery_reviewed",
      metadata: {
        decision,
        requestId,
        targetUserId: target?.auth_user_id ?? null,
      },
      request,
      scope: "system",
      success: true,
      target: target?.name ?? requestId,
      targetUserId: target?.auth_user_id ?? null,
    }).catch((e) => console.error("[audit-fail]", e))

    return jsonResponse({ status: decision }, 200, request)
  } catch (error) {
    console.error("recovery_review_request_failed", error)
    return authError("request_failed", 400, request)
  }
})
