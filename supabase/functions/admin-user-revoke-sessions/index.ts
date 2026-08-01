import { completeAdminAction, createAdminActionContext, errorResponse, handleAdminCors } from "../_shared/admin-users.ts"
import { revokeAuthUserSessions } from "../_shared/auth-sessions.ts"

Deno.serve(async (request) => {
  const cors = handleAdminCors(request)
  if (cors) return cors

  try {
    const context = await createAdminActionContext(request)
    await revokeAuthUserSessions(context.admin, context.target.auth_user_id)

    return completeAdminAction(context, "sessions_revoked")
  } catch (caughtError) {
    return errorResponse(request, caughtError instanceof Error ? caughtError.message : "Não foi possível revogar as sessões.")
  }
})
