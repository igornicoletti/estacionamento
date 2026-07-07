import {
  adminUpdateUserSchema,
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
    const input = adminUpdateUserSchema.parse(await req.json())

    if (isGlobalRole(input.role) && input.unitId) {
      return genericAuthError(400, req)
    }

    if (!isGlobalRole(input.role) && !input.unitId) {
      return genericAuthError(400, req)
    }

    const supabase = createAdminClient()
    const cpf = normalizeCpf(input.cpf)
    const cpfHash = await hashSensitiveValue(cpf)
    const { data: appUser, error: appUserError } = await supabase
      .from("app_users")
      .select("id")
      .eq("auth_user_id", input.targetUserId)
      .maybeSingle()

    if (appUserError || !appUser) {
      return genericAuthError(400, req)
    }

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        cpf_display: formatCpf(cpf),
        cpf_hmac: cpfHash,
        cpf_masked: maskCpf(cpf),
        email: input.email ?? null,
        name: input.name,
        phone_display: formatPhone(input.phone),
        phone_masked: maskPhone(input.phone),
        role: input.role,
        updated_by: actor.authUserId,
      })
      .eq("auth_user_id", input.targetUserId)

    if (updateError) {
      return genericAuthError(undefined, req)
    }

    const { error: deleteUnitError } = await supabase
      .from("app_user_units")
      .delete()
      .eq("app_user_id", appUser.id)

    if (deleteUnitError) {
      return genericAuthError(undefined, req)
    }

    if (input.unitId) {
      const { error: insertUnitError } = await supabase
        .from("app_user_units")
        .insert({
          app_user_id: appUser.id,
          unit_id: input.unitId,
        })

      if (insertUnitError) {
        return genericAuthError(undefined, req)
      }
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "user_updated",
      scope: "system",
      success: true,
      target: input.name,
      targetUserId: input.targetUserId,
    })

    return jsonResponse({ message: "Usuário atualizado." }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
