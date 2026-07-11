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

import { canAssignRole, isGlobalRole } from "../_shared/admin-users.ts"

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  try {
    const actor = requireAdminActor(await getAuthenticatedActor(request))
    const input = adminCreateUserSchema.parse(await request.json())

    if (!canAssignRole({
      auth_user_id: actor.authUserId,
      id: actor.id,
      name: actor.name,
      role: actor.role as "owner" | "admin" | "auditor" | "manager" | "operator",
      status: actor.status,
    }, input.role)) {
      return genericAuthError(403, request)
    }

    if (isGlobalRole(input.role) && input.unitId) {
      return genericAuthError(400, request)
    }

    if (!isGlobalRole(input.role) && !input.unitId) {
      return genericAuthError(400, request)
    }

    const supabase = createAdminClient()
    const cpf = normalizeCpf(input.cpf)
    const cpfHash = await hashSensitiveValue(cpf)
    const technicalEmail = `auth+${crypto.randomUUID()}@estacionamento.redemontecarlo.com.br`

    const { data: existingUser } = await supabase
      .from("app_users")
      .select("id")
      .eq("cpf_hmac", cpfHash)
      .maybeSingle()

    if (existingUser) {
      return genericAuthError(409, request)
    }

    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: technicalEmail,
      email_confirm: true,
      password: input.temporaryPassword,
      user_metadata: {},
    })

    if (createError || !authUser.user) {
      return genericAuthError(400, request)
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
        name: input.name.trim(),
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
      return genericAuthError(400, request)
    }

    if (input.unitId) {
      const { error: unitError } = await supabase.from("app_user_units").insert({
        app_user_id: appUser.id,
        unit_id: input.unitId,
      })

      if (unitError) {
        await supabase.from("app_users").delete().eq("id", appUser.id)
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return genericAuthError(400, request)
      }
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "user_created",
      metadata: { role: input.role },
      scope: "system",
      success: true,
      target: input.name.trim(),
      targetUserId: authUser.user.id,
    })

    return jsonResponse({ ok: true, id: appUser.id, appUserId: appUser.id, authUserId: authUser.user.id, message: "Usuário criado." }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
