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

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
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
    const maskedPhone = normalizedPhone ? maskPhone(normalizedPhone) : null
    const currentProfileResponse = await supabase
      .from("app_users")
      .select("id, phone_display, phone_masked")
      .eq("auth_user_id", actor.authUserId)
      .maybeSingle()

    if (currentProfileResponse.error || !currentProfileResponse.data) {
      console.error("profile_lookup_failed", {
        actorUserId: actor.authUserId,
        error: currentProfileResponse.error?.message,
      })
      return authError("request_failed", 400, request)
    }

    const currentPhoneDisplay = readString(currentProfileResponse.data.phone_display)
    const currentPhoneMasked = readString(currentProfileResponse.data.phone_masked)
    const phoneChanged = Boolean(
      formattedPhone &&
        (currentPhoneDisplay
          ? currentPhoneDisplay !== formattedPhone
          : currentPhoneMasked !== maskedPhone)
    )
    let shouldResetPasskey = false

    if (phoneChanged) {
      const passkeyCountResponse = await supabase
        .schema("auth")
        .from("webauthn_credentials")
        .select("id", { count: "exact", head: true })
        .eq("user_id", actor.authUserId)

      if (passkeyCountResponse.error) {
        console.error("profile_passkey_lookup_failed", {
          actorUserId: actor.authUserId,
          error: passkeyCountResponse.error.message,
        })
        return authError("request_failed", 400, request)
      }

      shouldResetPasskey = (passkeyCountResponse.count ?? 0) > 0
    }

    const updatePayload: Record<string, unknown> = {
      avatar_url: normalizedAvatarUrl,
      email: normalizedEmail,
      name: input.name.trim(),
      updated_at: new Date().toISOString(),
      updated_by: actor.authUserId,
    }

    if (formattedPhone && normalizedPhone && maskedPhone) {
      updatePayload.phone_display = formattedPhone
      updatePayload.phone_masked = maskedPhone
    }

    if (shouldResetPasskey) {
      updatePayload.failed_attempts = 0
      updatePayload.last_failed_at = null
      updatePayload.locked_until = null
      updatePayload.status = "passkey_reset"
    }

    const updateResponse = await supabase
      .from("app_users")
      .update(updatePayload)
      .eq("auth_user_id", actor.authUserId)
      .select("id")
      .maybeSingle()

    if (updateResponse.error || !updateResponse.data) {
      console.error("profile_update_failed", {
        actorUserId: actor.authUserId,
        error: updateResponse.error?.message,
      })
      return authError("request_failed", 400, request)
    }

    if (shouldResetPasskey) {
      const credentialsResponse = await supabase
        .schema("auth")
        .from("webauthn_credentials")
        .delete()
        .eq("user_id", actor.authUserId)

      if (credentialsResponse.error) {
        console.error("profile_passkey_revoke_failed", {
          actorUserId: actor.authUserId,
          error: credentialsResponse.error.message,
        })
        return authError("request_failed", 400, request)
      }

      await supabase
        .schema("auth")
        .from("mfa_factors")
        .delete()
        .eq("user_id", actor.authUserId)
        .eq("factor_type", "webauthn")

      await supabase.auth.admin.signOut(actor.authUserId, "global")
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

    if (shouldResetPasskey) {
      await writeAuditEvent({
        actor: actor.name,
        actorUserId: actor.authUserId,
        event: "passkey_reset_requested",
        metadata: { source: "profile_phone_changed" },
        request,
        scope: "system",
        success: true,
        target: actor.name,
        targetUserId: actor.authUserId,
      }).catch((e) => console.error("[audit-fail]", e))
    }

    return jsonResponse(
      {
        ok: true,
        data: {
          avatarUrl: normalizedAvatarUrl,
          email: normalizedEmail,
          name: input.name.trim(),
          phoneMasked: formattedPhone,
          requiresPasskeyRegistration: shouldResetPasskey,
        },
        message: shouldResetPasskey
          ? "Perfil atualizado. Cadastre uma nova passkey para continuar."
          : "Perfil atualizado.",
      },
      200,
      request
    )
  } catch (error) {
    console.error("profile_update_request_failed", error)
    return authError("invalid_payload", 400, request)
  }
})
