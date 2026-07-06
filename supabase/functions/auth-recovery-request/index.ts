import {
  createAdminClient,
  genericAuthError,
  getRequestFingerprint,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  maskPhone,
  normalizeCpf,
  recoveryRequestSchema,
  registerRateLimitAttempt,
  writeAuditEvent,
} from "../_shared/index.ts"

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const input = recoveryRequestSchema.parse(await req.json())
    const cpfHash = await hashSensitiveValue(normalizeCpf(input.cpf))
    const fingerprint = getRequestFingerprint(req)
    const ipHash = await hashSensitiveValue(fingerprint.ip, "REQUEST_HMAC_SECRET")
    const allowed = await registerRateLimitAttempt({
      bucket: "auth-recovery",
      keyHash: cpfHash,
      lockMinutes: 60,
      maxAttempts: 3,
    })

    if (!allowed) {
      return genericAuthError(429, req)
    }

    const supabase = createAdminClient()
    await supabase.from("access_recovery_requests").insert({
      cpf_hmac: cpfHash,
      description: input.description,
      email: input.email || null,
      phone_masked: maskPhone(input.phone),
      reason: input.reason,
      request_ip_hash: ipHash,
    })
    await writeAuditEvent({
      actor: "Solicitação pública",
      event: "access_recovery_requested",
      ipHash,
      scope: "login",
      success: true,
      target: "Conta não revelada",
    })

    return jsonResponse({
      message:
        "Se os dados puderem ser validados, a solicitação será analisada pela administração.",
    }, 200, req)
  } catch {
    return genericAuthError(400, req)
  }
})
