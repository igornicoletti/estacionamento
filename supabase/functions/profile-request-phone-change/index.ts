import {
  createAdminClient,
  formatPhone,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  maskPhone,
  profilePhoneSchema,
  writeAuditEvent,
} from "../_shared/index.ts"

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)
    const input = profilePhoneSchema.parse(await request.json())

    if (!actor || actor.status !== "active") {
      return genericAuthError(401, request)
    }

    const supabase = createAdminClient()
    const updateResponse = await supabase
      .from("app_users")
      .update({
        pending_phone_display: formatPhone(input.phone),
        pending_phone_masked: maskPhone(input.phone),
        updated_at: new Date().toISOString(),
        updated_by: actor.authUserId,
      })
      .eq("auth_user_id", actor.authUserId)

    if (updateResponse.error) {
      return genericAuthError(400, request)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "phone_change_requested",
      request,
      scope: "system",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({ message: "Solicitação registrada." }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
