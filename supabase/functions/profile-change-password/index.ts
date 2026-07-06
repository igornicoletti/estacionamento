import {
  createAdminClient,
  createPasswordAuthClient,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  profilePasswordSchema,
  writeAuditEvent,
} from "../_shared/index.ts"

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const actor = await getAuthenticatedActor(req)
    const input = profilePasswordSchema.parse(await req.json())

    if (!actor || actor.status !== "active") {
      return genericAuthError(401)
    }

    const supabase = createAdminClient()
    const { data: appUser } = await supabase
      .from("app_users")
      .select("technical_email")
      .eq("auth_user_id", actor.authUserId)
      .maybeSingle()

    if (!appUser) {
      return genericAuthError()
    }

    const authClient = createPasswordAuthClient()
    const { error: verifyError } = await authClient.auth.signInWithPassword({
      email: String(appUser.technical_email),
      password: input.currentPassword,
    })

    if (verifyError) {
      return genericAuthError()
    }

    await supabase.auth.admin.updateUserById(actor.authUserId, {
      password: input.newPassword,
    })
    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "password_changed",
      scope: "system",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    })

    return jsonResponse({ message: "Senha alterada." })
  } catch {
    return genericAuthError()
  }
})
