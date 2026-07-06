import {
  authStartSchema,
  genericAuthError,
  getRequestFingerprint,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  normalizeCpf,
  registerRateLimitAttempt,
  createAdminClient,
} from "../_shared/index.ts"

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const input = authStartSchema.parse(await req.json())
    const cpf = normalizeCpf(input.cpf)
    const cpfHash = await hashSensitiveValue(cpf)
    const fingerprint = getRequestFingerprint(req)
    const ipHash = await hashSensitiveValue(fingerprint.ip, "REQUEST_HMAC_SECRET")
    const allowed = await registerRateLimitAttempt({
      bucket: "auth-start",
      keyHash: cpfHash,
      lockMinutes: 15,
      maxAttempts: 8,
    })

    if (!allowed) {
      return genericAuthError(429, req)
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from("app_users")
      .select("id, status")
      .eq("cpf_hmac", cpfHash)
      .maybeSingle()

    const purpose =
      user?.status === "pending"
        ? "first_access"
        : user?.status === "password_reset"
          ? "password_reset"
          : user?.status === "passkey_reset"
            ? "passkey_reset"
            : "login"

    const { data: flow } = await supabase
      .from("auth_flow_attempts")
      .insert({
        app_user_id: user?.id,
        cpf_hmac: cpfHash,
        expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
        purpose,
        request_ip_hash: ipHash,
      })
      .select("flow_id")
      .single()

    return jsonResponse({
      flowId: flow?.flow_id,
      message: "Continue a autenticação.",
      nextAction: "use_password",
    }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
