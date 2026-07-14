import { createAdminClient } from "./auth-supabase-admin.ts"

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

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

export type AuthenticatedActor =
  NonNullable<Awaited<ReturnType<typeof getAuthenticatedActor>>>

export async function actorHasPermission(
  actor: Awaited<ReturnType<typeof getAuthenticatedActor>>,
  permissionKey: string,
  supabase: SupabaseAdminClient = createAdminClient()
) {
  if (!actor || actor.status !== "active") {
    return false
  }

  const permissionResponse = await supabase
    .from("permissions")
    .select("id")
    .eq("key", permissionKey)
    .eq("is_active", true)
    .maybeSingle()

  if (!permissionResponse.error && permissionResponse.data?.id) {
    const rolePermissionResponse = await supabase
      .from("role_permissions")
      .select("id")
      .eq("permission_id", String(permissionResponse.data.id))
      .eq("role", actor.role)
      .limit(1)

    if (!rolePermissionResponse.error && (rolePermissionResponse.data ?? []).length > 0) {
      return true
    }
  }

  const legacyResponse = await supabase
    .from("app_role_permissions")
    .select("permission_key")
    .eq("role_key", actor.role)
    .in("permission_key", [permissionKey, "*"])
    .limit(1)

  if (legacyResponse.error) {
    console.error("permission_lookup_failed", {
      permissionKey,
      role: actor.role,
      error: legacyResponse.error.message,
    })
    return false
  }

  return (legacyResponse.data ?? []).length > 0
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
