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

import { canAssignRole, getAppUserByAuthUserId, isGlobalRole } from "../_shared/admin-users.ts"

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  try {
    const actor = requireAdminActor(await getAuthenticatedActor(request))
    const input = adminUpdateUserSchema.parse(await request.json())
    const supabase = createAdminClient()
    const actorUser = await getAppUserByAuthUserId(supabase, actor.authUserId)
    const targetUser = await getAppUserByAuthUserId(supabase, input.targetUserId)

    if (actor.authUserId === input.targetUserId) {
      return genericAuthError(403, request)
    }

    if (targetUser.role === "owner" && actor.role !== "owner") {
      return genericAuthError(403, request)
    }

    if (!canAssignRole(actorUser, input.role)) {
      return genericAuthError(403, request)
    }

    if (isGlobalRole(input.role) && input.unitId) {
      return genericAuthError(400, request)
    }

    if (!isGlobalRole(input.role) && !input.unitId) {
      return genericAuthError(400, request)
    }

    const cpf = normalizeCpf(input.cpf)
    const cpfHash = await hashSensitiveValue(cpf)
    const { data: duplicateUser } = await supabase
      .from("app_users")
      .select("id")
      .eq("cpf_hmac", cpfHash)
      .neq("auth_user_id", input.targetUserId)
      .maybeSingle()

    if (duplicateUser) {
      return genericAuthError(409, request)
    }

    if (!isGlobalRole(input.role) && input.unitId) {
      const { error: unitError } = await supabase
        .from("app_user_units")
        .upsert(
          {
            app_user_id: targetUser.id,
            unit_id: input.unitId,
          },
          { onConflict: "app_user_id" }
        )

      if (unitError) {
        return genericAuthError(400, request)
      }
    }

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        cpf_display: formatCpf(cpf),
        cpf_hmac: cpfHash,
        cpf_masked: maskCpf(cpf),
        email: input.email ?? null,
        name: input.name.trim(),
        phone_display: formatPhone(input.phone),
        phone_masked: maskPhone(input.phone),
        role: input.role,
        updated_by: actor.authUserId,
      })
      .eq("auth_user_id", input.targetUserId)

    if (updateError) {
      return genericAuthError(400, request)
    }

    if (isGlobalRole(input.role)) {
      const { error: unitDeleteError } = await supabase
        .from("app_user_units")
        .delete()
        .eq("app_user_id", targetUser.id)

      if (unitDeleteError) {
        return genericAuthError(400, request)
      }
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "user_updated",
      metadata: { previousRole: targetUser.role, role: input.role },
      scope: "system",
      success: true,
      target: input.name.trim(),
      targetUserId: input.targetUserId,
    })

    return jsonResponse({ ok: true, id: targetUser.id, appUserId: targetUser.id, authUserId: input.targetUserId, message: "Usuário atualizado." }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
