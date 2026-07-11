import { completeAdminAction, createAdminActionContext, errorResponse, handleAdminCors } from "../_shared/admin-users.ts"

Deno.serve(async (request) => {
  const cors = handleAdminCors(request)
  if (cors) return cors

  try {
    const context = await createAdminActionContext(request)
    const signOutResponse = await context.admin.auth.admin.signOut(context.target.auth_user_id, "global")

    if (signOutResponse.error) {
      throw new Error("Não foi possível revogar as sessões.")
    }

    return completeAdminAction(context, "sessions_revoked")
  } catch (caughtError) {
    return errorResponse(request, caughtError instanceof Error ? caughtError.message : "Não foi possível revogar as sessões.")
  }
})
