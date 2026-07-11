import { completeAdminAction, createAdminActionContext, errorResponse, handleAdminCors } from "../_shared/admin-users.ts"

Deno.serve(async (request) => {
  const cors = handleAdminCors(request)
  if (cors) return cors

  try {
    const context = await createAdminActionContext(request)
    const statusResponse = await context.admin
      .from("app_users")
      .update({ status: "password_reset", locked_until: null })
      .eq("auth_user_id", context.target.auth_user_id)

    if (statusResponse.error) {
      throw new Error("Não foi possível redefinir a autenticação.")
    }

    await context.admin.auth.admin.signOut(context.target.auth_user_id, "global")

    return completeAdminAction(context, "password_reset_requested")
  } catch (caughtError) {
    return errorResponse(request, caughtError instanceof Error ? caughtError.message : "Não foi possível redefinir a autenticação.")
  }
})
