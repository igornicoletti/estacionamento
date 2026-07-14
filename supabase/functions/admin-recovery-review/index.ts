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

    const requestId = readString(body.requestId)
    const decision = readDecision(body.decision)
    const reviewReason = readString(body.reviewReason)

    if (!requestId || !decision || !reviewReason || reviewReason.length < 10) {
      return authError("invalid_payload", 400, request)
    }

    const status = decision === "approved" ? "approved" : "denied"
    const updateResponse = await supabase
      .from("access_recovery_requests")
      .update({
        reviewed_at: new Date().toISOString(),
        reviewed_by: actor.authUserId,
        review_reason: reviewReason,
        status,
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
      metadata: { decision, requestId },
      reason: reviewReason,
      request,
      scope: "system",
      success: true,
      target: requestId,
    })

    return jsonResponse({ status }, 200, request)
  } catch (error) {
    console.error("recovery_review_request_failed", error)
    return authError("request_failed", 400, request)
  }
})
