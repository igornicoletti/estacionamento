import { createAdminClient } from "./auth-supabase-admin.ts"

const IDLE_TIMEOUT_MS = 45 * 60_000

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")

  if (parts.length !== 3) {
    return null
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)

    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

async function touchSessionActivity(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  authUserId: string
) {
  const { data: activity, error: activityError } = await supabase
    .from("app_session_activity")
    .select("last_seen_at")
    .eq("session_id", sessionId)
    .maybeSingle()

  if (activityError) {
    console.error("[auth-context] session_activity_lookup_failed", {
      code: activityError.code,
      message: activityError.message,
    })
    return true
  }

  const lastSeenAt =
    activity && typeof activity.last_seen_at === "string"
      ? new Date(activity.last_seen_at).getTime()
      : null

  if (lastSeenAt && Date.now() - lastSeenAt > IDLE_TIMEOUT_MS) {
    await supabase
      .schema("auth")
      .from("sessions")
      .delete()
      .eq("id", sessionId)

    await supabase
      .from("app_session_activity")
      .delete()
      .eq("session_id", sessionId)

    return false
  }

  const { error: upsertError } = await supabase
    .from("app_session_activity")
    .upsert(
      {
        auth_user_id: authUserId,
        last_seen_at: new Date().toISOString(),
        session_id: sessionId,
      },
      { onConflict: "session_id" }
    )

  if (upsertError) {
    console.error("[auth-context] session_activity_upsert_failed", {
      code: upsertError.code,
      message: upsertError.message,
    })
  }

  return true
}

export async function getAuthenticatedActor(req: Request) {
  const authorization = req.headers.get("authorization")

  if (!authorization) {
    return null
  }

  const token = authorization.replace(/^Bearer\s+/i, "")
  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return null
  }

  // Reject tokens whose underlying session row was revoked (e.g. by an
  // admin action), even if the JWT itself has not expired yet.
  const payload = decodeJwtPayload(token)
  const sessionId =
    payload && typeof payload.session_id === "string"
      ? payload.session_id
      : null

  if (sessionId) {
    const { data: session } = await supabase
      .schema("auth")
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle()

    if (!session) {
      return null
    }

    const isSessionActive = await touchSessionActivity(
      supabase,
      sessionId,
      data.user.id
    )

    if (!isSessionActive) {
      return null
    }
  }

  const { data: profile } = await supabase
    .from("app_users")
    .select("id, auth_user_id, name, role, status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle()

  if (!profile) {
    return null
  }

  return {
    authUserId: data.user.id,
    id: String(profile.id),
    name: String(profile.name),
    role: String(profile.role),
    status: String(profile.status),
  }
}

export function requireAdminActor(actor: Awaited<ReturnType<typeof getAuthenticatedActor>>) {
  if (!actor || actor.status !== "active") {
    throw new Error("Unauthorized")
  }

  if (actor.role !== "owner" && actor.role !== "admin") {
    throw new Error("Forbidden")
  }

  return actor
}
