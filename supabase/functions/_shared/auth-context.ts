import { createAdminClient } from "./auth-supabase-admin.ts"

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
