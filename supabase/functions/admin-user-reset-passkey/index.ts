import { completeAdminAction, createAdminActionContext, errorResponse, handleAdminCors } from "../_shared/admin-users.ts"

Deno.serve(async (request) => {
  const cors = handleAdminCors(request)
  if (cors) return cors

  try {
    const context = await createAdminActionContext(request)
    const updateResponse = await context.admin
      .from("app_users")
      .update({ status: "passkey_reset", locked_until: null })
      .eq("auth_user_id", context.target.auth_user_id)

    if (updateResponse.error) {
      throw new Error("Não foi possível resetar a passkey.")
    }

    const credentialsResponse = await context.admin
      .schema("auth")
      .from("webauthn_credentials")
      .delete()
      .eq("user_id", context.target.auth_user_id)

    if (credentialsResponse.error) {
      throw new Error("Não foi possível remover as passkeys anteriores.")
    }

    await context.admin
      .schema("auth")
      .from("mfa_factors")
      .delete()
      .eq("user_id", context.target.auth_user_id)
      .eq("factor_type", "webauthn")

    await context.admin.auth.admin.signOut(context.target.auth_user_id, "global")

    return completeAdminAction(context, "passkey_reset_requested")
  } catch (caughtError) {
    return errorResponse(request, caughtError instanceof Error ? caughtError.message : "Não foi possível resetar a passkey.")
  }
})
