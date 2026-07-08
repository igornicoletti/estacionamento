import {
  adminCreateUserSchema,
  createAdminClient,
  formatCpf,
  formatPhone,
  genericAuthError,
  getAuthenticatedActor,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  maskCpf,
  maskPhone,
  normalizeCpf,
  requireAdminActor,
  writeAuditEvent,
} from "../_shared/index.ts"

function isGlobalRole(role: string) {
  return role === "owner" || role === "admin" || role === "auditor"
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const actor = requireAdminActor(await getAuthenticatedActor(req))
    const input = adminCreateUserSchema.parse(await req.json())

    if (isGlobalRole(input.role) && input.unitId) {
      return genericAuthError(400, req)
    }

    if (!isGlobalRole(input.role) && !input.unitId) {
      return genericAuthError(400, req)
    }

    const supabase = createAdminClient()
    const cpf = normalizeCpf(input.cpf)
    const cpfHash = await hashSensitiveValue(cpf)
    const technicalEmail = `auth+${crypto.randomUUID()}@estacionamento.redemontecarlo.com.br`

    const { data: authUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: technicalEmail,
        email_confirm: true,
        password: input.temporaryPassword,
        user_metadata: {},
      })

    if (createError || !authUser.user) {
      return genericAuthError(400, req)
    }

    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .insert({
        auth_user_id: authUser.user.id,
        cpf_display: formatCpf(cpf),
        cpf_hmac: cpfHash,
        cpf_masked: maskCpf(cpf),
        created_by: actor.authUserId,
        email: input.email ?? null,
        name: input.name,
        phone_display: formatPhone(input.phone),
        phone_masked: maskPhone(input.phone),
        role: input.role,
        status: "pending",
        technical_email: technicalEmail,
      })
      .select("id")
      .single()

    if (appUserError || !appUser) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return genericAuthError(400, req)
    }

    if (input.unitId) {
      const { error: unitError } = await supabase.from("app_user_units").insert({
        app_user_id: appUser.id,
        unit_id: input.unitId,
      })

      if (unitError) {
        await supabase.from("app_users").delete().eq("id", appUser.id)
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return genericAuthError(undefined, req)
      }
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "user_created",
      scope: "system",
      success: true,
      target: input.name,
      targetUserId: authUser.user.id,
    })

    return jsonResponse({ id: appUser.id, message: "Usuário criado." }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
