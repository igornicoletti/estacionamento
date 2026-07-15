import {
  createAdminClient,
  genericAuthError,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  maskPhone,
  recoveryRequestSchema,
  registerRateLimitAttempt,
  writeAuditEvent,
} from "../_shared/index.ts"

const recoveryMaxAttempts = 5
const recoveryLockMinutes = 15
const minResponseTimeMs = 800

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function handleRecoveryRequest(request: Request): Promise<Response> {
  const input = recoveryRequestSchema.parse(await request.json())
  const admin = createAdminClient()
  const cpfHash = await hashSensitiveValue(input.cpf)
  const ipHash = await hashSensitiveValue(
    request.headers.get("x-forwarded-for") ?? "unknown"
  )

  const allowed = await registerRateLimitAttempt({
    bucket: "recovery_request",
    keyHash: ipHash,
    maxAttempts: recoveryMaxAttempts,
    lockMinutes: recoveryLockMinutes,
  })

  if (!allowed) {
    return genericAuthError(429, request)
  }

  const response = await admin.from("access_recovery_requests").insert({
    cpf_hmac: cpfHash,
    description: input.description || null,
    email: input.email,
    phone_masked: maskPhone(input.phone),
    reason: input.reason,
    request_ip_hash: ipHash,
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
  }).catch((e) => console.error("[audit-fail]", e))

  return jsonResponse({ ok: true, message: "Solicitação registrada." }, 200, request)
}

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== "POST") {
    return genericAuthError(405, request)
  }

  try {
    const [result] = await Promise.all([
      handleRecoveryRequest(request),
      delay(minResponseTimeMs),
    ])

    return result
  } catch {
    return genericAuthError(400, request)
  }
})
