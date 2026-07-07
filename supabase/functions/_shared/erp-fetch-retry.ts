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
 */

const defaultMaxAttempts = 3
const defaultBaseDelayMs = 300
const defaultMaxDelayMs = 4_000

const retryableHttpStatuses = new Set([408, 425, 429, 500, 502, 503, 504])

// Matches the transient network/DNS/TLS-routing failures documented for
// this ERP host (unstable DNS resolution intermittently routing to the
// wrong backend/certificate). See runbook notes on the legacy integration.
const transientNetworkErrorPattern =
  /dns error|failed to lookup|name or service not known|error trying to connect|tcp connect error|connection (refused|reset)|network error|invalid peer certificate|econnreset|socket hang up|eai_again/i

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
