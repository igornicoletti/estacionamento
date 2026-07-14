function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function normalizeCpf(value: string) {
  return onlyDigits(value).slice(0, 11)
}

export function normalizePhone(value: string) {
  return onlyDigits(value).slice(0, 11)
}

export function formatCpf(value: string) {
  const cpf = normalizeCpf(value)
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

export function formatPhone(value: string) {
  const phone = normalizePhone(value)

  if (phone.length <= 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`
  }

  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
}

export function maskCpf(value: string) {
  const digits = normalizeCpf(value)
  return digits.length === 11 ? `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**` : "***"
}

export function maskPhone(value: string) {
  const digits = normalizePhone(value)
  const suffix = digits.slice(-4).padStart(4, "0")

  return `(**) *****-${suffix}`
}

function getHashSecret(secretName: string) {
  const secret =
    Deno.env.get(secretName) ??
    (secretName === "CPF_HMAC_SECRET" ? Deno.env.get("APP_HMAC_SECRET") : null)

  if (!secret) {
    throw new Error(`Missing required env ${secretName}`)
  }

  return secret
}

export async function hashSensitiveValue(value: string, secretName = "CPF_HMAC_SECRET") {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getHashSecret(secretName)),
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
