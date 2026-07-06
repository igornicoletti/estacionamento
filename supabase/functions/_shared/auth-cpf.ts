function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function normalizeCpf(value: string) {
  return onlyDigits(value)
}

export function maskCpf(value: string) {
  const digits = normalizeCpf(value)
  const suffix = digits.slice(-2).padStart(2, "0")

  return `***.***.***-${suffix}`
}

export function maskPhone(value: string) {
  const digits = onlyDigits(value)
  const suffix = digits.slice(-4).padStart(4, "0")

  return `(**) *****-${suffix}`
}

export async function hashSensitiveValue(value: string, secretName = "CPF_HMAC_SECRET") {
  const secret = Deno.env.get(secretName)

  if (!secret) {
    throw new Error(`Missing required env ${secretName}`)
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  )

  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export function getRequestFingerprint(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  }
}
