import {
  completeAdminAction,
  createAdminActionContext,
  errorResponse,
  handleAdminCors,
} from "../_shared/admin-users.ts"
import { revokeAuthUserSessions } from "../_shared/auth-sessions.ts"

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

    await revokeAuthUserSessions(context.admin, userId)

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
