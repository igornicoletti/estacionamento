import {
  genericAuthError,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  maskPhone,
  recoveryRequestSchema,
  writeAuditEvent,
  createAdminClient,
} from "../_shared/index.ts"

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const input = recoveryRequestSchema.parse(await request.json())
    const admin = createAdminClient()
    const cpfHash = await hashSensitiveValue(input.cpf)

    const response = await admin.from("access_recovery_requests").insert({
      cpf_hmac: cpfHash,
      description: input.description || null,
      email: input.email,
      phone_masked: maskPhone(input.phone),
      reason: input.reason,
      request_ip_hash: await hashSensitiveValue(
        request.headers.get("x-forwarded-for") ?? "unknown"
      ),
      user_agent_hash: await hashSensitiveValue(
        request.headers.get("user-agent") ?? "unknown"
      ),
    })

    if (response.error) {
      return genericAuthError(400, request)
    }

    await writeAuditEvent({
      actor: "Sistema",
      event: "access_recovery_requested",
      metadata: { reason: input.reason },
      request,
      scope: "login",
      success: true,
      target: "Solicitação de recuperação",
    })

    return jsonResponse({ ok: true, message: "Solicitação registrada." }, 200, request)
  } catch {
    return genericAuthError(400, request)
  }
})
