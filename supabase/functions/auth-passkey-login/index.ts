import {
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

    if (!actor || actor.status !== "active") {
      return genericAuthError(401, request)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "login_passkey_success",
      request,
      scope: "login",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({
      message: "Login com passkey registrado.",
      ok: true,
    }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
