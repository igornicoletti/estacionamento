import type { EdgeSupabaseClient } from "./auth-supabase-admin.ts"

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  const payload = parts[1]

  if (parts.length !== 3 || !payload) {
    return null
  }

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)

    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getBearerToken(request: Request) {
  const authorization =
    request.headers.get("authorization") ??
    request.headers.get("Authorization")

  return authorization?.replace(/^Bearer\s+/i, "").trim() || null
}

export function getTokenSessionId(token: string) {
  const payload = decodeJwtPayload(token)

  return payload && typeof payload.session_id === "string"
    ? payload.session_id
    : null
}

export async function isRequestSessionActive(
  request: Request,
  admin: EdgeSupabaseClient
) {
  const token = getBearerToken(request)
  const sessionId = token ? getTokenSessionId(token) : null

  if (!sessionId) {
    return false
  }

  const response = await admin.rpc("is_auth_session_active", {
    p_session_id: sessionId,
  })

  if (response.error) {
    console.error("auth_session_lookup_failed", {
      error: response.error.message,
    })
    return false
  }

  return response.data === true
}
