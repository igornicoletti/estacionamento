import {
  adminCreateUserSchema,
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

import { canAssignRole, isGlobalRole } from "../_shared/admin-users.ts"
import { createAdminClient } from "../_shared/auth-supabase-admin.ts"

function getTechnicalEmailDomain() {
  const domain = Deno.env.get("APP_TECHNICAL_EMAIL_DOMAIN")?.trim().toLowerCase()

  if (!domain || domain.includes("@") || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    console.error("technical_email_domain_invalid")
    return null
  }

  return domain
}

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

    const cpf = normalizeCpf(input.cpf)
    const cpfHash = await hashSensitiveValue(cpf)
    const technicalEmailDomain = getTechnicalEmailDomain()

    if (!technicalEmailDomain) {
      return genericAuthError(500, request)
    }

    const technicalEmail = `auth+${crypto.randomUUID()}@${technicalEmailDomain}`

    const existingUserResponse = await supabase
      .from("app_users")
      .select("id")
      .eq("cpf_hmac", cpfHash)
      .maybeSingle()

    if (existingUserResponse.data) {
      return genericAuthError(409, request)
    }

    const authUserResponse = await supabase.auth.admin.createUser({
      email: technicalEmail,
      email_confirm: true,
      password: input.temporaryPassword,
      user_metadata: {},
    })

    if (authUserResponse.error || !authUserResponse.data.user) {
      return genericAuthError(400, request)
    }

    const authUserId = authUserResponse.data.user.id

    const appUserResponse = await supabase
      .from("app_users")
      .insert({
        auth_user_id: authUserId,
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

    if (appUserResponse.error || !appUserResponse.data) {
      await supabase.auth.admin.deleteUser(authUserId)
      return genericAuthError(400, request)
    }

    const appUserId = appUserResponse.data.id

    if (input.unitId) {
      const unitResponse = await supabase.from("app_user_units").insert({
        app_user_id: appUserId,
        unit_id: input.unitId,
      })

      if (unitResponse.error) {
        await supabase.from("app_users").delete().eq("id", appUserId)
        await supabase.auth.admin.deleteUser(authUserId)
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
      targetUserId: authUserId,
    }).catch((e) => console.error("[audit-fail]", e))

    return jsonResponse({ ok: true, id: appUserId, appUserId, authUserId, message: "Usuário criado." }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
