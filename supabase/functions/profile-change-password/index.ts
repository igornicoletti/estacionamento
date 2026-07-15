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

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)
    const input = profilePasswordSchema.parse(await request.json())

    if (!actor || actor.status !== "active") {
      return genericAuthError(401, request)
    }

    if (input.currentPassword === input.newPassword) {
      return genericAuthError(400, request)
    }

    const supabase = createAdminClient()
    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("technical_email")
      .eq("auth_user_id", actor.authUserId)
      .maybeSingle()

    if (appUserError || !appUser) {
      return genericAuthError(400, request)
    }

    const authClient = createPasswordAuthClient()
    const { error: verifyError } = await authClient.auth.signInWithPassword({
      email: String(appUser.technical_email),
      password: input.currentPassword,
    })

    if (verifyError) {
      return genericAuthError(400, request)
    }

    const updateResponse = await supabase.auth.admin.updateUserById(
      actor.authUserId,
      { password: input.newPassword }
    )

    if (updateResponse.error) {
      return genericAuthError(400, request)
    }

    await supabase.auth.admin.signOut(actor.authUserId, "global")

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "password_changed",
      request,
      scope: "system",
      success: true,
      target: actor.name,
      targetUserId: actor.authUserId,
    }).catch((e) => console.error("[audit-fail]", e))

    return jsonResponse({ message: "Senha alterada." }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
