import {
  createAdminClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  writeAuditEvent,
} from "../_shared/index.ts"

type Decision = "approved" | "denied"
type Actor = NonNullable<Awaited<ReturnType<typeof getAuthenticatedActor>>>

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

function canReviewAccessRequests(
  actor: Awaited<ReturnType<typeof getAuthenticatedActor>>
): actor is Actor {
  return (
    actor !== null &&
    actor.status === "active" &&
    (actor.role === "owner" || actor.role === "admin")
  )
}

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)

    if (!canReviewAccessRequests(actor)) {
      return genericAuthError(403, request)
    }

    const body = await request.json().catch(() => null)

    if (!isRecord(body)) {
      return genericAuthError(400, request)
    }

    const requestId = readString(body.requestId)
    const decision = readDecision(body.decision)
    const reviewReason = readString(body.reviewReason)

    if (!requestId || !decision || !reviewReason || reviewReason.length < 10) {
      return genericAuthError(400, request)
    }

    const supabase = createAdminClient()
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
      return genericAuthError(updateResponse.error ? 400 : 404, request)
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
  } catch {
    return genericAuthError(400, request)
  }
})
