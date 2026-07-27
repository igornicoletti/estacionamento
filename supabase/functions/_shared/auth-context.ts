import { createAdminClient } from "./auth-supabase-admin.ts"
import {
  getBearerToken,
  isRequestSessionActive,
} from "./auth-session.ts"

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

export async function getAuthenticatedActor(req: Request) {
  const token = getBearerToken(req)

  if (!token) {
    return null
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user || !(await isRequestSessionActive(req, supabase))) {
    return null
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

  const appPermissionResponse = await supabase
    .from("app_role_permissions")
    .select("permission_key")
    .eq("role_key", actor.role)
    .in("permission_key", [permissionKey, "*"])
    .limit(1)

  if (
    !appPermissionResponse.error &&
    (appPermissionResponse.data ?? []).length > 0
  ) {
    return true
  }

  if (appPermissionResponse.error) {
    console.error("app_permission_lookup_failed", {
      permissionKey,
      role: actor.role,
      error: appPermissionResponse.error.message,
    })
  }

  return false
}

export async function requirePermissionActor(
  actor: Awaited<ReturnType<typeof getAuthenticatedActor>>,
  permissionKey: string,
  supabase: SupabaseAdminClient = createAdminClient()
) {
  if (!actor || actor.status !== "active") {
    throw new Error("Unauthorized")
  }

  if (!(await actorHasPermission(actor, permissionKey, supabase))) {
    throw new Error("Forbidden")
  }

  return actor
}

export function requireAdminActor(
  actor: Awaited<ReturnType<typeof getAuthenticatedActor>>
) {
  if (!actor || actor.status !== "active") {
    throw new Error("Unauthorized")
  }

  if (actor.role !== "owner" && actor.role !== "admin") {
    throw new Error("Forbidden")
  }

  return actor
}
