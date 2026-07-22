/**
 * Resilience helper for outbound ERP HTTP calls.
 *
 * Implements retry with exponential backoff and full jitter, the pattern
 * documented by AWS for distributed-system network calls:
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 *
 * Only transient failures are retried (network/DNS/TLS-routing errors,
 * request timeouts and 408/425/429/5xx HTTP statuses). Non-transient
 * failures (4xx auth/validation errors, invalid payloads) fail fast on the
 * first attempt so real configuration problems surface immediately instead
 * of being masked by retries.
 *
 * When all retry attempts fail with DNS errors the caller can opt into a
 * DNS-over-HTTPS (DoH) fallback via `fetchWithErpRetryAndDoH`, which
 * resolves the hostname through Cloudflare 1.1.1.1 and retries over the
 * resolved IP (HTTP only — HTTPS+IP requires SNI override).
 */

import {
  buildDoHFallbackRequest,
  isDnsError,
  resolveIPv4ViaDoH,
} from "./erp-url.ts"

const defaultMaxAttempts = 3
const defaultBaseDelayMs = 300
const defaultMaxDelayMs = 4_000

const retryableHttpStatuses = new Set([408, 425, 429, 500, 502, 503, 504])

// Matches transient network/DNS failures. Certificate validation failures are
// intentionally not retried: production must fix the ERP hostname/certificate
// instead of masking TLS identity errors.
const transientNetworkErrorPattern =
  /dns error|failed to lookup|name or service not known|error trying to connect|tcp connect error|connection (refused|reset)|network error|econnreset|socket hang up|eai_again/i

function resolvePositiveIntEnv(name: string, fallback: number, min: number, max: number) {
  const raw = Deno.env.get(name)?.trim()

  if (!raw) {
    return fallback
  }

  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

function resolveMaxAttempts() {
  return resolvePositiveIntEnv("ERP_REQUEST_MAX_ATTEMPTS", defaultMaxAttempts, 1, 6)
}

function resolveBaseDelayMs() {
  return resolvePositiveIntEnv("ERP_REQUEST_RETRY_BASE_DELAY_MS", defaultBaseDelayMs, 50, 5_000)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Full jitter: delay = random(0, min(maxDelay, base * 2^attempt))
function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number) {
  const capped = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)

  return Math.random() * capped
}

function isTransientNetworkError(error: unknown) {
  return error instanceof Error && transientNetworkErrorPattern.test(error.message)
}

type AttemptOutcome =
  | { kind: "success"; response: Response }
  | { kind: "retry"; error: Error }
  | { kind: "fail"; error: Error }

async function attemptOnce(
  buildRequest: (signal: AbortSignal) => Promise<Response>,
  timeoutMs: number
): Promise<AttemptOutcome> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await buildRequest(controller.signal)

    if (response.ok) {
      return { kind: "success", response }
    }

    const error = new Error(`erp_http_${response.status}`)

    return retryableHttpStatuses.has(response.status)
      ? { kind: "retry", error }
      : { kind: "fail", error }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { kind: "retry", error: new Error("erp_timeout") }
    }

    if (isTransientNetworkError(error)) {
      return { kind: "retry", error: error as Error }
    }

    return {
      kind: "fail",
      error: error instanceof Error ? error : new Error("erp_unknown_error"),
    }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Performs an HTTP request with retry-on-transient-failure semantics.
 *
 * `buildRequest` is called once per attempt with a fresh `AbortSignal` so
 * each attempt gets its own timeout window. Non-transient failures (4xx,
 * invalid payload errors, etc.) are thrown immediately without retrying.
 */
export async function fetchWithErpRetry(
  buildRequest: (signal: AbortSignal) => Promise<Response>,
  timeoutMs: number
): Promise<Response> {
  const maxAttempts = resolveMaxAttempts()
  const baseDelayMs = resolveBaseDelayMs()

  let lastError = new Error("erp_unknown_error")

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const outcome = await attemptOnce(buildRequest, timeoutMs)

    if (outcome.kind === "success") {
      return outcome.response
    }

    lastError = outcome.error

    if (outcome.kind === "fail" || attempt === maxAttempts - 1) {
      throw lastError
    }

    console.warn(
      `[erp-fetch-retry] attempt ${attempt + 1}/${maxAttempts} failed (${lastError.message}), retrying`
    )

    await sleep(backoffDelay(attempt, baseDelayMs, defaultMaxDelayMs))
  }

  throw lastError
}

/**
 * Like `fetchWithErpRetry` but with an automatic DNS-over-HTTPS (DoH)
 * fallback phase when all normal attempts fail with DNS errors.
 *
 * Phase 1: normal retry (same as `fetchWithErpRetry`).
 * Phase 2: if Phase 1 failed with a DNS error, resolve the hostname via
 *          Cloudflare DoH, rebuild the request URL with the resolved IP
 *          and retry once. Only works for plain HTTP — HTTPS requests
 *          skip this phase because Deno fetch cannot override SNI.
 *
 * Use this variant in sync functions where the ERP hostname has historically
 * unstable DNS resolution.
 */
export async function fetchWithErpRetryAndDoH(
  originalUrl: URL,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<Response> {
  try {
    return await fetchWithErpRetry(
      (signal) => fetch(originalUrl.toString(), { method: "GET", headers, signal }),
      timeoutMs
    )
  } catch (primaryError) {
    if (!isDnsError(primaryError)) {
      throw primaryError
    }

    // DoH fallback only makes sense for HTTP — HTTPS needs SNI = hostname
    if (originalUrl.protocol === "https:") {
      console.warn(
        "[erp-fetch-retry] DNS failed for HTTPS URL; DoH fallback skipped (SNI limitation)"
      )
      throw primaryError
    }

    console.warn(
      `[erp-fetch-retry] DNS persistently failing for ${originalUrl.hostname}; trying DoH Cloudflare…`
    )

    let ip: string

    try {
      ip = await resolveIPv4ViaDoH(originalUrl.hostname)
      console.warn(`[erp-fetch-retry] DoH resolved ${originalUrl.hostname} → ${ip}`)
    } catch (dohError) {
      console.error("[erp-fetch-retry] DoH also failed", dohError)
      throw primaryError
    }

    const fallback = buildDoHFallbackRequest(originalUrl, ip, headers)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(fallback.url, {
        method: "GET",
        headers: fallback.headers,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`erp_http_${response.status}`)
      }

      return response
    } catch (error) {
      throw new Error("[erp-fetch-retry] DoH fallback request failed", {
        cause: error instanceof Error ? error : primaryError,
      })
    } finally {
      clearTimeout(timeout)
    }
  }
}
