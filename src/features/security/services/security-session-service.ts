import { getSupabaseBrowserClient } from "@/lib"

import type { SecuritySessionSummary } from "../types/security-types"

function getBrowserName(userAgent: string) {
  if (/Edg\//.test(userAgent)) return "Microsoft Edge"
  if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return "Google Chrome"
  if (/Firefox\//.test(userAgent)) return "Mozilla Firefox"
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari"
  return "Navegador não identificado"
}

function getOperatingSystem(userAgent: string) {
  if (/Windows/i.test(userAgent)) return "Windows"
  if (/Android/i.test(userAgent)) return "Android"
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS"
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS"
  if (/Linux/i.test(userAgent)) return "Linux"
  return "Sistema operacional não identificado"
}

function readClientIpFromSession(session: unknown) {
  if (!session || typeof session !== "object") return null

  const user = "user" in session ? (session as { user?: unknown }).user : null
  if (!user || typeof user !== "object") return null

  const metadata = "app_metadata" in user
    ? (user as { app_metadata?: unknown }).app_metadata
    : null
  if (!metadata || typeof metadata !== "object") return null

  const ipAddress = (metadata as Record<string, unknown>).ip_address
  return typeof ipAddress === "string" && ipAddress.trim() ? ipAddress.trim() : null
}

function readAuthenticatedAtFromSession(session: unknown) {
  if (!session || typeof session !== "object") return null

  const user = "user" in session ? (session as { user?: unknown }).user : null
  if (!user || typeof user !== "object") return null

  const lastSignInAt = (user as { last_sign_in_at?: unknown }).last_sign_in_at
  return typeof lastSignInAt === "string" && lastSignInAt.trim() ? lastSignInAt.trim() : null
}

export function getLocalSecuritySessionSummary(): SecuritySessionSummary {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent

  return {
    authenticatedAt: null,
    browser: getBrowserName(userAgent),
    ipAddress: null,
    operatingSystem: getOperatingSystem(userAgent),
  }
}

export async function getCurrentSecuritySession(): Promise<SecuritySessionSummary> {
  const fallback = getLocalSecuritySessionSummary()
  const supabase = getSupabaseBrowserClient()

  if (!supabase) return fallback

  const { data } = await supabase.auth.getSession()
  const session = data.session

  return {
    ...fallback,
    authenticatedAt: readAuthenticatedAtFromSession(session),
    ipAddress: readClientIpFromSession(session),
  }
}
