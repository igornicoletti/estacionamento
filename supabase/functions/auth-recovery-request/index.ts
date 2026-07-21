import {
  createAdminClient,
  formatPhone,
  genericAuthError,
  handleCors,
  hashSensitiveValue,
  jsonResponse,
  maskPhone,
  normalizePhone,
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

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() || null
}

async function resolveContactVerification(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    cpfHash: string
    email?: string | null
    phone: string
  }
) {
  const targetResponse = await admin
    .from("app_users")
    .select("email, name, phone_display, technical_email")
    .eq("cpf_hmac", input.cpfHash)
    .maybeSingle()

  if (targetResponse.error) {
    console.error("recovery_contact_verification_failed", targetResponse.error.message)
    throw targetResponse.error
  }

  const target = targetResponse.data

  if (!target) {
    return {
      emailMatchesAccount: null,
      phoneMatchesAccount: null,
      targetAccountFound: false,
      targetUserName: null,
    }
  }

  const requestedPhone = normalizePhone(input.phone)
  const targetPhone = normalizePhone(String(target.phone_display ?? ""))
  const requestedEmail = normalizeEmail(input.email)
  const targetEmails = [
    normalizeEmail(String(target.email ?? "")),
    normalizeEmail(String(target.technical_email ?? "")),
  ].filter((value): value is string => Boolean(value))

  return {
    emailMatchesAccount: requestedEmail
      ? targetEmails.includes(requestedEmail)
      : null,
    phoneMatchesAccount: targetPhone.length >= 10
      ? targetPhone === requestedPhone
      : null,
    targetAccountFound: true,
    targetUserName: String(target.name ?? "").trim() || null,
  }
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

  const verification = await resolveContactVerification(admin, {
    cpfHash,
    email: input.email,
    phone: input.phone,
  })

  const response = await admin.from("access_recovery_requests").insert({
    cpf_hmac: cpfHash,
    description: input.description || null,
    email: input.email,
    email_matches_account: verification.emailMatchesAccount,
    phone_display: formatPhone(input.phone),
    phone_matches_account: verification.phoneMatchesAccount,
    phone_masked: maskPhone(input.phone),
    reason: input.reason,
    request_ip_hash: ipHash,
    target_account_found: verification.targetAccountFound,
    target_user_name: verification.targetUserName,
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
