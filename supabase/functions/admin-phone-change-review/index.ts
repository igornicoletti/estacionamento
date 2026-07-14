import {
  actorHasPermission,
  authError,
  createAdminClient,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
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

    const targetUserId = readString(body.targetUserId)
    const decision = readDecision(body.decision)

    if (!targetUserId || !decision) {
      return authError("invalid_payload", 400, request)
    }

    const currentResponse = await supabase
      .from("app_users")
      .select("id, auth_user_id, name, pending_phone_display, pending_phone_masked")
      .eq("auth_user_id", targetUserId)
      .not("pending_phone_masked", "is", null)
      .maybeSingle()

    if (currentResponse.error || !currentResponse.data) {
      if (currentResponse.error) {
        console.error("phone_change_lookup_failed", currentResponse.error.message)
      }

      return authError("not_found", 404, request)
    }

    const pendingPhoneMasked = readString(currentResponse.data.pending_phone_masked)

    if (!pendingPhoneMasked) {
      return authError("not_found", 404, request)
    }

    const pendingPhoneDisplay =
      readString(currentResponse.data.pending_phone_display) ?? pendingPhoneMasked
    const updatePayload = decision === "approved"
      ? {
          pending_phone_display: null,
          pending_phone_masked: null,
          phone_display: pendingPhoneDisplay,
          phone_masked: pendingPhoneMasked,
          updated_at: new Date().toISOString(),
          updated_by: actor.authUserId,
        }
      : {
          pending_phone_display: null,
          pending_phone_masked: null,
          updated_at: new Date().toISOString(),
          updated_by: actor.authUserId,
        }

    const updateResponse = await supabase
      .from("app_users")
      .update(updatePayload)
      .eq("auth_user_id", targetUserId)
      .not("pending_phone_masked", "is", null)
      .select("id")
      .maybeSingle()

    if (updateResponse.error || !updateResponse.data) {
      if (updateResponse.error) {
        console.error("phone_change_update_failed", updateResponse.error.message)
      }

      return authError("request_failed", 400, request)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "phone_change_reviewed",
      metadata: { decision },
      request,
      scope: "system",
      success: true,
      target: String(currentResponse.data.name),
      targetUserId,
    })

    return jsonResponse({ status: decision }, 200, request)
  } catch (error) {
    console.error("phone_change_review_request_failed", error)
    return authError("request_failed", 400, request)
  }
})
