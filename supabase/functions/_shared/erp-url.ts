/**
 * Shared ERP URL resolution and DNS resilience helpers.
 *
 * Supports both HTTPS (preferred) and HTTP (fallback with warning) because the
 * ERP at Rede Monte Carlo historically uses plain HTTP with unstable DNS.
 *
 * When HTTPS is available the runtime validates certificates normally. When the
 * ERP only exposes HTTP the functions still work but log a warning on every
 * call so the insecure transport is visible in logs and easy to audit.
 *
 * DNS-over-HTTPS (DoH) via Cloudflare 1.1.1.1 is used as a last-resort
 * fallback when the runtime DNS resolver cannot reach the ERP hostname — a
 * pattern ported from the legacy `legadoFetch.ts` helper.
 */

const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query"
const DOH_TIMEOUT_MS = 8_000

function isHostedRuntime() {
  return Boolean(Deno.env.get("DENO_DEPLOYMENT_ID"))
}

function requireEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required env ${name}`)
  }

  return value
}

/**
 * Resolves and validates ERP_BASE_URL.
 *
 * In production (hosted runtime):
 *   - HTTPS is strongly preferred and used without restrictions.
 *   - HTTP is allowed as a fallback but emits a console warning on every call
 *     so the insecure transport is visible in observability.
 *   - localhost / loopback addresses are always rejected.
 *
 * In development:
 *   - Both HTTP and HTTPS are allowed without warnings.
 */
export function resolveErpBaseUrl() {
  const rawBaseUrl = requireEnv("ERP_BASE_URL").trim()

  let url: URL

  try {
    url = new URL(rawBaseUrl)
  } catch {
    throw new Error("ERP_BASE_URL inválida. Informe uma URL HTTP(S) absoluta.")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("ERP_BASE_URL inválida. Apenas HTTP(S) é permitido.")
  }

  const hostname = url.hostname.toLowerCase()

  if (isHostedRuntime()) {
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      throw new Error("ERP_BASE_URL não pode apontar para localhost em produção.")
    }

    if (url.protocol === "http:") {
      console.warn(
        "[erp-url] ⚠️ ERP_BASE_URL usa HTTP sem TLS. " +
        "A comunicação não é criptografada. " +
        "Configure HTTPS no servidor ERP assim que possível."
      )
    }
  }

  return url
}

// ---------------------------------------------------------------------------
// DNS-over-HTTPS (DoH) fallback — ported from legacy legadoFetch.ts
// ---------------------------------------------------------------------------

const DNS_ERROR_PATTERN =
  /dns error|failed to lookup|name or service not known|enotfound|eai_again|could not resolve host/i

export function isDnsError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")

  return DNS_ERROR_PATTERN.test(message)
}

/**
 * Resolves a hostname to an IPv4 address using Cloudflare DoH (1.1.1.1).
 *
 * Used as a last-resort fallback when the Deno runtime DNS resolver fails —
 * the ERP hostname `hubapi.redemontecarlo.com.br` historically fails ~50% of
 * DNS lookups from Edge Functions.
 */
export async function resolveIPv4ViaDoH(hostname: string) {
  const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=A`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DOH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { accept: "application/dns-json" },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`DoH HTTP ${response.status}`)
    }

    const data = await response.json()
    const answers: Array<{ type: number; data: string }> = data?.Answer ?? []
    const record = answers.find(
      (entry) => entry.type === 1 && /^\d{1,3}(\.\d{1,3}){3}$/.test(entry.data)
    )

    if (!record) {
      throw new Error(`DoH sem registro A para ${hostname}`)
    }

    return record.data
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Rebuilds a URL replacing the hostname with an IP address and returns the
 * new URL string plus a `Host` header to preserve HTTP routing on the target.
 *
 * Only safe for plain HTTP — HTTPS with IP requires SNI override which Deno
 * fetch does not support. When the ERP migrates to HTTPS with a valid
 * certificate the DoH fallback naturally stops being needed (DNS errors
 * become rare with a properly configured hostname).
 */
export function buildDoHFallbackRequest(
  originalUrl: URL,
  ip: string,
  headers: Record<string, string>
) {
  const fallbackUrl = new URL(originalUrl.toString())
  fallbackUrl.hostname = ip

  return {
    url: fallbackUrl.toString(),
    headers: { ...headers, host: originalUrl.host },
  }
}
