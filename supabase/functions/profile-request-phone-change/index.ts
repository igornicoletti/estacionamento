import {
  createAdminClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  maskPhone,
  profilePhoneSchema,
  writeAuditEvent,
} from "../_shared/index.ts"

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const actor = await getAuthenticatedActor(req)
    const input = profilePhoneSchema.parse(await req.json())

    if (!actor || actor.status !== "active") {
      return genericAuthError(401, req)
    }

    const supabase = createAdminClient()
    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        pending_phone_masked: maskPhone(input.phone),
        updated_by: actor.authUserId,
      })
      .eq("auth_user_id", actor.authUserId)

    if (updateError) {
      return genericAuthError(undefined, req)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "phone_change_requested",
      scope: "system",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({ message: "Solicitação registrada." }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
