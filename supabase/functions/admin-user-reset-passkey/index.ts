import {
  completeAdminAction,
  createAdminActionContext,
  errorResponse,
  handleAdminCors,
} from "../_shared/admin-users.ts"

Deno.serve(async (request) => {
  const cors = handleAdminCors(request)
  if (cors) return cors

  try {
    const context = await createAdminActionContext(request)
    const userId = context.target.auth_user_id
    const listResponse = await context.admin.auth.admin.passkey.listPasskeys({
      userId,
    })

    if (listResponse.error) {
      throw new Error("Não foi possível consultar as passkeys do usuário.")
    }

    for (const passkey of listResponse.data ?? []) {
      const deleteResponse = await context.admin.auth.admin.passkey.deletePasskey({
        passkeyId: passkey.id,
        userId,
      })

      if (deleteResponse.error) {
        throw new Error("Não foi possível remover todas as passkeys do usuário.")
      }
    }

    const signOutResponse = await context.admin.auth.admin.signOut(userId, "global")

    if (signOutResponse.error) {
      throw new Error("Não foi possível revogar as sessões do usuário.")
    }

    return completeAdminAction(context, "passkeys_removed")
  } catch (caughtError) {
    return errorResponse(
      request,
      caughtError instanceof Error
        ? caughtError.message
        : "Não foi possível remover as passkeys."
    )
  }
})
