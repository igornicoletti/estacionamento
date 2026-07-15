import {
  authError,
  createAdminClient,
  formatPhone,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
  maskPhone,
  normalizePhone,
  profileUpdateSchema,
  writeAuditEvent,
} from "../_shared/index.ts"

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value)
}

function isValidPhoneDigits(value: string) {
  const hasValidLength = value.length === 10 || value.length === 11
  const areaCode = Number(value.slice(0, 2))

  if (!hasValidLength || !Number.isInteger(areaCode) || areaCode < 11 || areaCode > 99) {
    return false
  }

  return !hasRepeatedDigits(value) && !hasRepeatedDigits(value.slice(2))
}

Deno.serve(async (request) => {
  const cors = handleCors(request)

  if (cors) {
    return cors
  }

  if (request.method !== "POST") {
    return authError("method_not_allowed", 405, request)
  }

  try {
    const actor = await getAuthenticatedActor(request)

    if (!actor || actor.status !== "active") {
      return authError("unauthorized", 401, request)
    }

    const input = profileUpdateSchema.parse(await request.json())
    const supabase = createAdminClient()
    const normalizedEmail =
      typeof input.email === "string" && input.email.trim()
        ? input.email.trim()
        : null
    const normalizedAvatarUrl =
      typeof input.avatarUrl === "string" && input.avatarUrl.trim()
        ? input.avatarUrl.trim()
        : null
    const shouldUpdatePhone = typeof input.phone === "string"
    const normalizedPhone = shouldUpdatePhone ? normalizePhone(input.phone ?? "") : null

    if (shouldUpdatePhone && (!normalizedPhone || !isValidPhoneDigits(normalizedPhone))) {
      return authError("invalid_payload", 400, request)
    }

    const formattedPhone = normalizedPhone ? formatPhone(normalizedPhone) : null
    const updatePayload: Record<string, unknown> = {
      avatar_url: normalizedAvatarUrl,
      email: normalizedEmail,
      name: input.name.trim(),
      updated_at: new Date().toISOString(),
      updated_by: actor.authUserId,
    }

    if (formattedPhone && normalizedPhone) {
      updatePayload.phone_display = formattedPhone
      updatePayload.phone_masked = maskPhone(normalizedPhone)
      updatePayload.pending_phone_display = null
      updatePayload.pending_phone_masked = null
    }

    const updateResponse = await supabase
      .from("app_users")
      .update(updatePayload)
      .eq("auth_user_id", actor.authUserId)

    if (updateResponse.error) {
      console.error("profile_update_failed", {
        actorUserId: actor.authUserId,
        error: updateResponse.error.message,
      })
      return authError("request_failed", 400, request)
    }

    await writeAuditEvent({
      actor: actor.name,
      actorUserId: actor.authUserId,
      event: "profile_updated",
      request,
      scope: "system",
      success: true,
      target: input.name.trim(),
      targetUserId: actor.authUserId,
    }).catch((e) => console.error("[audit-fail]", e))

    return jsonResponse(
      {
        ok: true,
        data: {
          avatarUrl: normalizedAvatarUrl,
          email: normalizedEmail,
          name: input.name.trim(),
          phoneMasked: formattedPhone,
        },
        message: "Perfil atualizado.",
      },
      200,
      request
    )
  } catch (error) {
    console.error("profile_update_request_failed", error)
    return authError("invalid_payload", 400, request)
  }
})
