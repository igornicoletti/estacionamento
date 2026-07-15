import {
  adminUpdateUserSchema,
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
  requirePermissionActor,
  writeAuditEvent,
} from "../_shared/index.ts"

import { canAssignRole, getAppUserByAuthUserId, isGlobalRole } from "../_shared/admin-users.ts"
import { createAdminClient } from "../_shared/auth-supabase-admin.ts"

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  try {
    const supabase = createAdminClient()
    const actor = await requirePermissionActor(
      await getAuthenticatedActor(request),
      "users.manage",
      supabase
    )
    const input = adminUpdateUserSchema.parse(await request.json())
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
    const duplicateUserResponse = await supabase
      .from("app_users")
      .select("id")
      .eq("cpf_hmac", cpfHash)
      .neq("auth_user_id", input.targetUserId)
      .maybeSingle()

    if (duplicateUserResponse.data) {
      return genericAuthError(409, request)
    }

    if (!isGlobalRole(input.role) && input.unitId) {
      const unitResponse = await supabase
        .from("app_user_units")
        .upsert(
          {
            app_user_id: targetUser.id,
            unit_id: input.unitId,
          },
          { onConflict: "app_user_id" }
        )

      if (unitResponse.error) {
        return genericAuthError(400, request)
      }
    }

    const updateResponse = await supabase
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

    if (updateResponse.error) {
      return genericAuthError(400, request)
    }

    if (isGlobalRole(input.role)) {
      const unitDeleteResponse = await supabase
        .from("app_user_units")
        .delete()
        .eq("app_user_id", targetUser.id)

      if (unitDeleteResponse.error) {
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
    }).catch((e) => console.error("[audit-fail]", e))

    return jsonResponse({ ok: true, id: targetUser.id, appUserId: targetUser.id, authUserId: input.targetUserId, message: "Usuário atualizado." }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
