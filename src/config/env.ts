type ClientEnv = {
  supabaseUrl: string
  supabasePublishableKey: string
  operationalMockEnabled: boolean
  authDevBypass: boolean
  appOrigin: string
  webauthnRpId: string
}

type RawClientEnv = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
  VITE_OPERATIONAL_MOCK_ENABLED?: string
  VITE_OPERATIONAL_CAPTURES_MOCK_ENABLED?: string
  VITE_AUTH_DEV_BYPASS?: string
  VITE_APP_ORIGIN?: string
  VITE_WEBAUTHN_RP_ID?: string
  DEV: boolean
  PROD: boolean
  MODE: string
}

const runtimeEnv = import.meta.env as RawClientEnv

const DEFAULT_AUTH_DEV_BYPASS = false
const ENV_PUBLIC_ERROR_PREFIX = "Configuração de ambiente inválida."

type EnvErrorCode =
  | "ENV_BOOLEAN_INVALID"
  | "ENV_APP_ORIGIN_REQUIRED"
  | "ENV_APP_ORIGIN_INVALID"
  | "ENV_APP_ORIGIN_INSECURE"
  | "ENV_APP_ORIGIN_RUNTIME_MISMATCH"
  | "ENV_WEBAUTHN_RP_ID_EMPTY"
  | "ENV_WEBAUTHN_RP_ID_FORMAT"
  | "ENV_WEBAUTHN_RP_ID_IP"
  | "ENV_WEBAUTHN_RP_ID_ORIGIN_MISMATCH"
  | "ENV_AUTH_BYPASS_PROD"
  | "ENV_SUPABASE_URL_INVALID"
  | "ENV_SUPABASE_URL_INSECURE"
  | "ENV_SUPABASE_CONFIG_PARTIAL"
  | "ENV_SUPABASE_KEY_SECRET"
  | "ENV_SUPABASE_KEY_SERVICE_ROLE"
  | "ENV_SUPABASE_MISSING"
  | "ENV_OPERATIONAL_MOCK_PROD"

function throwEnvError(
  code: EnvErrorCode,
  message: string,
  debugDetails?: string
): never {
  if (runtimeEnv.DEV && debugDetails && typeof console !== "undefined") {
    console.error(`[env:${code}] ${debugDetails}`)
  }

  throw new Error(`${ENV_PUBLIC_ERROR_PREFIX} (${code}) ${message}`)
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function parseBooleanEnv(value: unknown, fallback = DEFAULT_AUTH_DEV_BYPASS) {
  const normalized = readOptionalString(value).toLowerCase()

  if (!normalized) {
    return fallback
  }

  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return false
  }

  throwEnvError(
    "ENV_BOOLEAN_INVALID",
    "Use true/false, 1/0, yes/no ou on/off para variáveis booleanas públicas.",
    "Boolean env parsing failed."
  )
}

function getRuntimeOrigin() {
  if (typeof window === "undefined") {
    return ""
  }

  return window.location.origin
}

function parseHttpOrigin(value: string, variableName: string) {
  try {
    const url = new URL(value)

    const isHttpProtocol = url.protocol === "http:" || url.protocol === "https:"
    const hasOnlyOrigin =
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password

    if (!isHttpProtocol || !hasOnlyOrigin) {
      throw new Error()
    }

    return url.origin
  } catch {
    throwEnvError(
      "ENV_APP_ORIGIN_INVALID",
      `${variableName} deve ser uma origin HTTP(S), sem path, query, hash ou credenciais.`,
      `Invalid origin format for ${variableName}.`
    )
  }
}

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  )
}

function assertSecureUrl(url: URL, variableName: string) {
  if (url.protocol === "https:") {
    return
  }

  if (runtimeEnv.DEV && isLocalHostname(url.hostname.toLowerCase())) {
    return
  }

  const code =
    variableName === "VITE_SUPABASE_URL"
      ? "ENV_SUPABASE_URL_INSECURE"
      : "ENV_APP_ORIGIN_INSECURE"

  throwEnvError(
    code,
    `${variableName} deve usar HTTPS fora de localhost em desenvolvimento.`,
    `${variableName} uses insecure protocol for non-local host.`
  )
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function getHostnameFromOrigin(origin: string) {
  return new URL(origin).hostname.toLowerCase()
}

function isIpv4Address(value: string) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)
}

function validateWebAuthnRpId(value: string) {
  const rpId = value.toLowerCase()

  if (!rpId) {
    throwEnvError(
      "ENV_WEBAUTHN_RP_ID_EMPTY",
      "VITE_WEBAUTHN_RP_ID não pode ser vazio.",
      "Empty WebAuthn RP ID."
    )
  }

  if (
    rpId.includes("://") ||
    rpId.includes("/") ||
    rpId.includes(":") ||
    rpId.startsWith(".") ||
    rpId.endsWith(".")
  ) {
    throwEnvError(
      "ENV_WEBAUTHN_RP_ID_FORMAT",
      "VITE_WEBAUTHN_RP_ID deve ser um hostname/domínio, não uma URL.",
      "Invalid WebAuthn RP ID format."
    )
  }

  if (isIpv4Address(rpId)) {
    throwEnvError(
      "ENV_WEBAUTHN_RP_ID_IP",
      "WebAuthn RP ID não deve ser um endereço IP. Use um domínio válido, como localhost em desenvolvimento.",
      "WebAuthn RP ID received an IPv4 address."
    )
  }

  return rpId
}

function isSameOrParentDomain(hostname: string, rpId: string) {
  return hostname === rpId || hostname.endsWith(`.${rpId}`)
}

function assertWebAuthnRpIdMatchesOrigin(origin: string, rpId: string) {
  const hostname = getHostnameFromOrigin(origin)

  if (!isSameOrParentDomain(hostname, rpId)) {
    throwEnvError(
      "ENV_WEBAUTHN_RP_ID_ORIGIN_MISMATCH",
      "VITE_WEBAUTHN_RP_ID deve corresponder ao hostname da origin da aplicação.",
      "WebAuthn RP ID and application origin mismatch."
    )
  }
}

function decodeJwtPayload(token: string) {
  const parts = token.split(".")

  if (parts.length !== 3) {
    return null
  }

  try {
    if (typeof atob !== "function") {
      return null
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const decoded = atob(padded)

    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

function assertSupabasePublishableKey(key: string) {
  if (!key) {
    return
  }

  if (key.startsWith("sb_secret_")) {
    throwEnvError(
      "ENV_SUPABASE_KEY_SECRET",
      "VITE_SUPABASE_PUBLISHABLE_KEY não pode receber uma secret key.",
      "Detected sb_secret_ key in public config."
    )
  }

  const payload = decodeJwtPayload(key)

  if (payload?.role === "service_role" || payload?.role === "supabase_admin") {
    throwEnvError(
      "ENV_SUPABASE_KEY_SERVICE_ROLE",
      "VITE_SUPABASE_PUBLISHABLE_KEY não pode receber uma service role key.",
      "Detected service role payload in public key."
    )
  }
}

function resolveAppOrigin() {
  const configuredAppOrigin = readOptionalString(runtimeEnv.VITE_APP_ORIGIN)
  const runtimeOrigin = getRuntimeOrigin()
  const appOrigin = configuredAppOrigin || runtimeOrigin

  if (!appOrigin) {
    throwEnvError(
      "ENV_APP_ORIGIN_REQUIRED",
      "Defina VITE_APP_ORIGIN quando window.location.origin não estiver disponível.",
      "Application origin could not be resolved."
    )
  }

  return parseHttpOrigin(
    appOrigin,
    configuredAppOrigin ? "VITE_APP_ORIGIN" : "window.location.origin"
  )
}

function resolveWebAuthnRpId(appOrigin: string) {
  const configuredWebAuthnRpId = readOptionalString(runtimeEnv.VITE_WEBAUTHN_RP_ID)

  return validateWebAuthnRpId(
    configuredWebAuthnRpId || getHostnameFromOrigin(appOrigin)
  )
}

function createClientEnv(): ClientEnv {
  const supabaseUrl = readOptionalString(runtimeEnv.VITE_SUPABASE_URL)
  const supabasePublishableKey = readOptionalString(
    runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY
  )

  const requestedAuthDevBypass = parseBooleanEnv(
    runtimeEnv.VITE_AUTH_DEV_BYPASS,
    DEFAULT_AUTH_DEV_BYPASS
  )
  const operationalMockEnabled = parseBooleanEnv(
    runtimeEnv.VITE_OPERATIONAL_MOCK_ENABLED ??
      runtimeEnv.VITE_OPERATIONAL_CAPTURES_MOCK_ENABLED,
    false
  )

  if (runtimeEnv.PROD && requestedAuthDevBypass) {
    throwEnvError(
      "ENV_AUTH_BYPASS_PROD",
      "VITE_AUTH_DEV_BYPASS não pode ficar ativo em produção.",
      "Auth bypass requested in production mode."
    )
  }

  if (runtimeEnv.PROD && operationalMockEnabled) {
    throwEnvError(
      "ENV_OPERATIONAL_MOCK_PROD",
      "VITE_OPERATIONAL_MOCK_ENABLED não pode ficar ativo em produção.",
      "Operational mock requested in production mode."
    )
  }

  if ((supabaseUrl && !supabasePublishableKey) || (!supabaseUrl && supabasePublishableKey)) {
    throwEnvError(
      "ENV_SUPABASE_CONFIG_PARTIAL",
      "Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em conjunto.",
      "Supabase public env is partially configured."
    )
  }

  if (supabaseUrl && !isValidHttpUrl(supabaseUrl)) {
    throwEnvError(
      "ENV_SUPABASE_URL_INVALID",
      "VITE_SUPABASE_URL deve ser uma URL HTTP(S) válida.",
      "Invalid Supabase URL format."
    )
  }

  if (supabaseUrl) {
    assertSecureUrl(new URL(supabaseUrl), "VITE_SUPABASE_URL")
  }

  assertSupabasePublishableKey(supabasePublishableKey)

  const appOrigin = resolveAppOrigin()
  const appOriginUrl = new URL(appOrigin)
  assertSecureUrl(appOriginUrl, "VITE_APP_ORIGIN")

  const runtimeOrigin = getRuntimeOrigin()

  if (runtimeOrigin && appOrigin !== runtimeOrigin) {
    throwEnvError(
      "ENV_APP_ORIGIN_RUNTIME_MISMATCH",
      "VITE_APP_ORIGIN deve corresponder à origin aberta no navegador.",
      "Configured application origin differs from window.location.origin."
    )
  }

  const webauthnRpId = resolveWebAuthnRpId(appOrigin)

  assertWebAuthnRpIdMatchesOrigin(appOrigin, webauthnRpId)

  return {
    supabaseUrl,
    supabasePublishableKey,
    operationalMockEnabled: runtimeEnv.DEV && operationalMockEnabled,
    authDevBypass: runtimeEnv.DEV && requestedAuthDevBypass,
    appOrigin,
    webauthnRpId,
  }
}

export const env = createClientEnv()

export function hasSupabaseBrowserEnv() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey)
}

export function assertSupabaseBrowserEnv() {
  if (hasSupabaseBrowserEnv()) {
    return
  }

  throwEnvError(
    "ENV_SUPABASE_MISSING",
    "Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
    "Supabase browser env missing."
  )
}

export function shouldBypassAuthInDev() {
  return env.authDevBypass
}
