import {
  createAdminClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
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

    if (
      !actor ||
      (actor.status !== "active" && actor.status !== "passkey_reset")
    ) {
      return genericAuthError(401, request)
    }

    const supabase = createAdminClient()
    const passkeysResponse = await supabase.auth.admin.passkey.listPasskeys({
      userId: actor.authUserId,
    })

    if (passkeysResponse.error || !passkeysResponse.data?.length) {
      return genericAuthError(400, request)
    }

    if (actor.status === "passkey_reset") {
      const statusResponse = await supabase
        .from("app_users")
        .update({ status: "active" })
        .eq("auth_user_id", actor.authUserId)

      if (statusResponse.error) {
        return genericAuthError(400, request)
      }
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "passkey_registered",
      request,
      scope: "system",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    }).catch((caughtError) => console.error("[audit-fail]", caughtError))

    return jsonResponse({
      flowId: null,
      message: "Passkey cadastrada.",
      nextAction: "authenticated",
    }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
